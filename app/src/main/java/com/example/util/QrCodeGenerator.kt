package com.example.util

/**
 * Pure-Kotlin ISO/IEC 18004 QR Code encoder (Byte mode, Error Correction Level M, Versions 1..10).
 * Generates a scannable boolean matrix (true = dark module, false = light module).
 */
object QrCodeGenerator {

  private data class VersionSpec(
    val version: Int,
    val totalCodewords: Int,
    val ecCodewordsPerBlock: Int,
    val numBlocksGroup1: Int,
    val dataCodewordsGroup1: Int,
    val numBlocksGroup2: Int,
    val dataCodewordsGroup2: Int,
    val alignments: IntArray,
  ) {
    val totalDataCodewords: Int
      get() = numBlocksGroup1 * dataCodewordsGroup1 + numBlocksGroup2 * dataCodewordsGroup2
  }

  // EC Level M specifications for QR Versions 1..10 (ISO/IEC 18004 Table 9)
  private val VERSION_SPECS = listOf(
    VersionSpec(1, 26, 10, 1, 16, 0, 0, intArrayOf()),
    VersionSpec(2, 44, 16, 1, 28, 0, 0, intArrayOf(6, 18)),
    VersionSpec(3, 70, 26, 1, 44, 0, 0, intArrayOf(6, 22)),
    VersionSpec(4, 100, 18, 2, 32, 0, 0, intArrayOf(6, 26)),
    VersionSpec(5, 134, 24, 2, 43, 0, 0, intArrayOf(6, 30)),
    VersionSpec(6, 172, 16, 4, 27, 0, 0, intArrayOf(6, 34)),
    VersionSpec(7, 196, 18, 4, 31, 0, 0, intArrayOf(6, 22, 38)),
    VersionSpec(8, 242, 22, 2, 38, 2, 39, intArrayOf(6, 24, 42)),
    VersionSpec(9, 292, 22, 3, 36, 2, 37, intArrayOf(6, 26, 46)),
    VersionSpec(10, 346, 26, 4, 43, 1, 44, intArrayOf(6, 28, 50)),
  )

  private val GF_EXP = IntArray(512)
  private val GF_LOG = IntArray(256)

  init {
    var x = 1
    for (i in 0 until 255) {
      GF_EXP[i] = x
      GF_LOG[x] = i
      x = x shl 1
      if (x and 0x100 != 0) {
        x = x xor 0x11D
      }
    }
    for (i in 255 until 512) {
      GF_EXP[i] = GF_EXP[i - 255]
    }
  }

  private fun gfMul(a: Int, b: Int): Int {
    if (a == 0 || b == 0) return 0
    return GF_EXP[GF_LOG[a] + GF_LOG[b]]
  }

  private fun rsGeneratorPoly(ecCount: Int): IntArray {
    var poly = intArrayOf(1)
    for (i in 0 until ecCount) {
      val factor = intArrayOf(1, GF_EXP[i])
      val next = IntArray(poly.size + 1)
      for (pIdx in poly.indices) {
        for (fIdx in factor.indices) {
          next[pIdx + fIdx] = next[pIdx + fIdx] xor gfMul(poly[pIdx], factor[fIdx])
        }
      }
      poly = next
    }
    return poly
  }

  private fun rsComputeEc(data: IntArray, ecCount: Int): IntArray {
    val gen = rsGeneratorPoly(ecCount)
    val res = IntArray(data.size + ecCount)
    System.arraycopy(data, 0, res, 0, data.size)
    for (i in data.indices) {
      val coef = res[i]
      if (coef != 0) {
        for (j in 1 until gen.size) {
          res[i + j] = res[i + j] xor gfMul(gen[j], coef)
        }
      }
    }
    return res.copyOfRange(data.size, res.size)
  }

  fun encode(content: String): Array<BooleanArray> {
    val rawBytes = content.toByteArray(Charsets.UTF_8)
    val spec = VERSION_SPECS.firstOrNull { s ->
      val charCountBits = if (s.version <= 9) 8 else 16
      val neededBits = 4 + charCountBits + rawBytes.size * 8
      neededBits <= s.totalDataCodewords * 8
    } ?: throw IllegalArgumentException("Content too long for QR Version 10M")

    val safeBytes = rawBytes
    val charCountBits = if (spec.version <= 9) 8 else 16

    // Build bit stream: Mode (0100 = Byte), CharCount, Bytes, Terminator, Padding
    val bits = mutableListOf<Int>()
    fun appendBits(value: Int, count: Int) {
      for (i in count - 1 downTo 0) {
        bits.add((value ushr i) and 1)
      }
    }

    appendBits(0b0100, 4) // Byte mode
    appendBits(safeBytes.size, charCountBits)
    for (b in safeBytes) {
      appendBits(b.toInt() and 0xFF, 8)
    }

    val maxDataBits = spec.totalDataCodewords * 8
    val terminatorLen = minOf(4, maxDataBits - bits.size)
    repeat(terminatorLen) { bits.add(0) }
    while (bits.size % 8 != 0) bits.add(0)

    var padByteIdx = 0
    while (bits.size < maxDataBits) {
      appendBits(if (padByteIdx % 2 == 0) 0xEC else 0x11, 8)
      padByteIdx++
    }

    val dataCodewords = IntArray(spec.totalDataCodewords)
    for (i in dataCodewords.indices) {
      var cw = 0
      for (bitIdx in 0 until 8) {
        cw = (cw shl 1) or bits[i * 8 + bitIdx]
      }
      dataCodewords[i] = cw
    }

    // Split into blocks & compute EC codewords
    val dataBlocks = mutableListOf<IntArray>()
    val ecBlocks = mutableListOf<IntArray>()
    var offset = 0
    repeat(spec.numBlocksGroup1) {
      val block = dataCodewords.copyOfRange(offset, offset + spec.dataCodewordsGroup1)
      offset += spec.dataCodewordsGroup1
      dataBlocks.add(block)
      ecBlocks.add(rsComputeEc(block, spec.ecCodewordsPerBlock))
    }
    repeat(spec.numBlocksGroup2) {
      val block = dataCodewords.copyOfRange(offset, offset + spec.dataCodewordsGroup2)
      offset += spec.dataCodewordsGroup2
      dataBlocks.add(block)
      ecBlocks.add(rsComputeEc(block, spec.ecCodewordsPerBlock))
    }

    // Interleave data codewords + EC codewords
    val interleaved = mutableListOf<Int>()
    val maxDataBlockLen = maxOf(spec.dataCodewordsGroup1, spec.dataCodewordsGroup2)
    for (i in 0 until maxDataBlockLen) {
      for (block in dataBlocks) {
        if (i < block.size) interleaved.add(block[i])
      }
    }
    for (i in 0 until spec.ecCodewordsPerBlock) {
      for (ec in ecBlocks) {
        if (i < ec.size) interleaved.add(ec[i])
      }
    }

    val finalBits = mutableListOf<Int>()
    for (cw in interleaved) {
      for (b in 7 downTo 0) {
        finalBits.add((cw ushr b) and 1)
      }
    }
    // Remainder bits for versions 2..6 (7 bits)
    val remainderBits = when (spec.version) {
      in 2..6 -> 7
      else -> 0
    }
    repeat(remainderBits) { finalBits.add(0) }

    val size = spec.version * 4 + 17
    val baseModules = Array(size) { BooleanArray(size) }
    val isFunction = Array(size) { BooleanArray(size) }

    fun setFunctionModule(row: Int, col: Int, dark: Boolean) {
      if (row in 0 until size && col in 0 until size) {
        baseModules[row][col] = dark
        isFunction[row][col] = true
      }
    }

    fun placeFinder(topRow: Int, leftCol: Int) {
      for (dr in -1..7) {
        for (dc in -1..7) {
          val r = topRow + dr
          val c = leftCol + dc
          if (r !in 0 until size || c !in 0 until size) continue
          val dist = maxOf(kotlin.math.abs(dr - 3), kotlin.math.abs(dc - 3))
          val dark = dist != 2 && dist != 4
          setFunctionModule(r, c, dark)
        }
      }
    }

    placeFinder(0, 0)
    placeFinder(0, size - 7)
    placeFinder(size - 7, 0)

    // Timing patterns
    for (i in 8 until size - 8) {
      val dark = i % 2 == 0
      setFunctionModule(6, i, dark)
      setFunctionModule(i, 6, dark)
    }

    // Alignment patterns
    val align = spec.alignments
    for (ar in align) {
      for (ac in align) {
        if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= size - 9) || (ar >= size - 9 && ac <= 8)) {
          continue
        }
        for (dr in -2..2) {
          for (dc in -2..2) {
            val dist = maxOf(kotlin.math.abs(dr), kotlin.math.abs(dc))
            setFunctionModule(ar + dr, ac + dc, dist != 1)
          }
        }
      }
    }

    // Dark module & reserve format info areas
    setFunctionModule(size - 8, 8, true)
    for (i in 0..8) {
      if (!isFunction[8][i]) isFunction[8][i] = true
      if (!isFunction[i][8]) isFunction[i][8] = true
    }
    for (i in size - 8 until size) {
      if (!isFunction[8][i]) isFunction[8][i] = true
      if (!isFunction[i][8]) isFunction[i][8] = true
    }

    // Reserve version info if version >= 7
    if (spec.version >= 7) {
      val versionBits = computeVersionInfo(spec.version)
      for (i in 0 until 6) {
        for (j in 0 until 3) {
          val bit = ((versionBits ushr (i * 3 + j)) and 1) == 1
          setFunctionModule(i, size - 11 + j, bit)
          setFunctionModule(size - 11 + j, i, bit)
        }
      }
    }

    // Place data bits in zig-zag
    var bitIdx = 0
    var col = size - 1
    var upward = true
    while (col > 0) {
      if (col == 6) col-- // Skip vertical timing column
      for (step in 0 until size) {
        val r = if (upward) size - 1 - step else step
        for (dc in 0..1) {
          val c = col - dc
          if (!isFunction[r][c]) {
            val dark = if (bitIdx < finalBits.size) finalBits[bitIdx++] == 1 else false
            baseModules[r][c] = dark
          }
        }
      }
      upward = !upward
      col -= 2
    }

    // Evaluate all 8 mask patterns and pick lowest penalty
    var bestMask = 0
    var bestPenalty = Int.MAX_VALUE
    var bestMatrix = baseModules

    for (mask in 0 until 8) {
      val candidate = Array(size) { r ->
        BooleanArray(size) { c ->
          if (isFunction[r][c]) baseModules[r][c]
          else baseModules[r][c] xor maskCondition(mask, r, c)
        }
      }
      applyFormatBits(candidate, mask)
      val penalty = computePenalty(candidate)
      if (penalty < bestPenalty) {
        bestPenalty = penalty
        bestMask = mask
        bestMatrix = candidate
      }
    }

    @Suppress("UNUSED_VARIABLE")
    val chosenMask = bestMask
    return bestMatrix
  }

  private fun maskCondition(mask: Int, r: Int, c: Int): Boolean {
    return when (mask) {
      0 -> (r + c) % 2 == 0
      1 -> r % 2 == 0
      2 -> c % 3 == 0
      3 -> (r + c) % 3 == 0
      4 -> ((r / 2) + (c / 3)) % 2 == 0
      5 -> ((r * c) % 2 + (r * c) % 3) == 0
      6 -> (((r * c) % 2) + ((r * c) % 3)) % 2 == 0
      7 -> (((r + c) % 2) + ((r * c) % 3)) % 2 == 0
      else -> false
    }
  }

  // BCH(15, 5) format info for EC level M (00) + mask (0..7)
  private fun applyFormatBits(matrix: Array<BooleanArray>, mask: Int) {
    val size = matrix.size
    val data = (0b00 shl 3) or mask
    var rem = data
    repeat(10) {
      rem = (rem shl 1) xor (((rem ushr 9) and 1) * 0x537)
    }
    val bits = ((data shl 10) or rem) xor 0x5412

    for (i in 0..5) {
      val dark = ((bits ushr i) and 1) == 1
      matrix[8][i] = dark
      matrix[size - 1 - i][8] = dark
    }
    matrix[8][7] = ((bits ushr 6) and 1) == 1
    matrix[size - 7][8] = ((bits ushr 6) and 1) == 1

    matrix[8][8] = ((bits ushr 7) and 1) == 1
    matrix[8][size - 8] = ((bits ushr 7) and 1) == 1
    matrix[size - 8][8] = true // Always-dark module

    matrix[7][8] = ((bits ushr 8) and 1) == 1
    matrix[8][size - 7] = ((bits ushr 8) and 1) == 1

    for (i in 9..14) {
      val dark = ((bits ushr i) and 1) == 1
      matrix[14 - i][8] = dark
      matrix[8][size - 15 + i] = dark
    }
  }

  private fun computeVersionInfo(version: Int): Int {
    var rem = version
    repeat(12) {
      rem = (rem shl 1) xor (((rem ushr 11) and 1) * 0x1F25)
    }
    return (version shl 12) or rem
  }

  private fun computePenalty(m: Array<BooleanArray>): Int {
    val n = m.size
    var penalty = 0
    // Rule 1: 5+ consecutive modules in row or column
    for (r in 0 until n) {
      var runColor = m[r][0]
      var runLen = 1
      for (c in 1 until n) {
        if (m[r][c] == runColor) {
          runLen++
          if (runLen == 5) penalty += 3 else if (runLen > 5) penalty += 1
        } else {
          runColor = m[r][c]
          runLen = 1
        }
      }
    }
    for (c in 0 until n) {
      var runColor = m[0][c]
      var runLen = 1
      for (r in 1 until n) {
        if (m[r][c] == runColor) {
          runLen++
          if (runLen == 5) penalty += 3 else if (runLen > 5) penalty += 1
        } else {
          runColor = m[r][c]
          runLen = 1
        }
      }
    }
    // Rule 2: 2x2 blocks
    for (r in 0 until n - 1) {
      for (c in 0 until n - 1) {
        val v = m[r][c]
        if (m[r][c + 1] == v && m[r + 1][c] == v && m[r + 1][c + 1] == v) {
          penalty += 3
        }
      }
    }
    // Rule 4: dark ratio
    var darkCount = 0
    for (r in 0 until n) {
      for (c in 0 until n) {
        if (m[r][c]) darkCount++
      }
    }
    val pct = (darkCount * 100) / (n * n)
    penalty += (kotlin.math.abs(pct - 50) / 5) * 10
    return penalty
  }
}
