(function () {

    /*===================filePath:[src/resource/jpeg_encoder_basic.js]======================*/
    (function () {

        /*
         Copyright (c) 2008, Adobe Systems Incorporated
         All rights reserved.

         Redistribution and use in source and binary forms, with or without
         modification, are permitted provided that the following conditions are
         met:

         * Redistributions of source code must retain the above copyright notice,
         this list of conditions and the following disclaimer.

         * Redistributions in binary form must reproduce the above copyright
         notice, this list of conditions and the following disclaimer in the
         documentation and/or other materials provided with the distribution.

         * Neither the name of Adobe Systems Incorporated nor the names of its
         contributors may be used to endorse or promote products derived from
         this software without specific prior written permission.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
         IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
         THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
         PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
         CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
         EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
         PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
         PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
         LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
         NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
         */

        /*
         JPEG encoder ported to JavaScript and optimized by Andreas Ritter, www.bytestrom.eu, 11/2009

         Basic GUI blocking jpeg encoder
         */

        function JPEGEncoder(quality) {
            var self = this;
            var fround = Math.round;
            var ffloor = Math.floor;
            var YTable = new Array(64);
            var UVTable = new Array(64);
            var fdtbl_Y = new Array(64);
            var fdtbl_UV = new Array(64);
            var YDC_HT;
            var UVDC_HT;
            var YAC_HT;
            var UVAC_HT;

            var bitcode = new Array(65535);
            var category = new Array(65535);
            var outputfDCTQuant = new Array(64);
            var DU = new Array(64);
            var byteout = [];
            var bytenew = 0;
            var bytepos = 7;

            var YDU = new Array(64);
            var UDU = new Array(64);
            var VDU = new Array(64);
            var clt = new Array(256);
            var RGB_YUV_TABLE = new Array(2048);
            var currentQuality;

            var ZigZag = [
                0, 1, 5, 6, 14, 15, 27, 28,
                2, 4, 7, 13, 16, 26, 29, 42,
                3, 8, 12, 17, 25, 30, 41, 43,
                9, 11, 18, 24, 31, 40, 44, 53,
                10, 19, 23, 32, 39, 45, 52, 54,
                20, 22, 33, 38, 46, 51, 55, 60,
                21, 34, 37, 47, 50, 56, 59, 61,
                35, 36, 48, 49, 57, 58, 62, 63
            ];

            var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
            var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
            var std_ac_luminance_values = [
                0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12,
                0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
                0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
                0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
                0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16,
                0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
                0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
                0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
                0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
                0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
                0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
                0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
                0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98,
                0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
                0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
                0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
                0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4,
                0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
                0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
                0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
                0xf9, 0xfa
            ];

            var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
            var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
            var std_ac_chrominance_values = [
                0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21,
                0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
                0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91,
                0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0,
                0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34,
                0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
                0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38,
                0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
                0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
                0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
                0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78,
                0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
                0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96,
                0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
                0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4,
                0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3,
                0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2,
                0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
                0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9,
                0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
                0xf9, 0xfa
            ];

            function initQuantTables(sf) {
                var YQT = [
                    16, 11, 10, 16, 24, 40, 51, 61,
                    12, 12, 14, 19, 26, 58, 60, 55,
                    14, 13, 16, 24, 40, 57, 69, 56,
                    14, 17, 22, 29, 51, 87, 80, 62,
                    18, 22, 37, 56, 68, 109, 103, 77,
                    24, 35, 55, 64, 81, 104, 113, 92,
                    49, 64, 78, 87, 103, 121, 120, 101,
                    72, 92, 95, 98, 112, 100, 103, 99
                ];

                for (var i = 0; i < 64; i++) {
                    var t = ffloor((YQT[i] * sf + 50) / 100);
                    if (t < 1) {
                        t = 1;
                    } else if (t > 255) {
                        t = 255;
                    }
                    YTable[ZigZag[i]] = t;
                }
                var UVQT = [
                    17, 18, 24, 47, 99, 99, 99, 99,
                    18, 21, 26, 66, 99, 99, 99, 99,
                    24, 26, 56, 99, 99, 99, 99, 99,
                    47, 66, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99
                ];
                for (var j = 0; j < 64; j++) {
                    var u = ffloor((UVQT[j] * sf + 50) / 100);
                    if (u < 1) {
                        u = 1;
                    } else if (u > 255) {
                        u = 255;
                    }
                    UVTable[ZigZag[j]] = u;
                }
                var aasf = [
                    1.0, 1.387039845, 1.306562965, 1.175875602,
                    1.0, 0.785694958, 0.541196100, 0.275899379
                ];
                var k = 0;
                for (var row = 0; row < 8; row++) {
                    for (var col = 0; col < 8; col++) {
                        fdtbl_Y[k] = (1.0 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                        fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                        k++;
                    }
                }
            }

            function computeHuffmanTbl(nrcodes, std_table) {
                var codevalue = 0;
                var pos_in_table = 0;
                var HT = new Array();
                for (var k = 1; k <= 16; k++) {
                    for (var j = 1; j <= nrcodes[k]; j++) {
                        HT[std_table[pos_in_table]] = [];
                        HT[std_table[pos_in_table]][0] = codevalue;
                        HT[std_table[pos_in_table]][1] = k;
                        pos_in_table++;
                        codevalue++;
                    }
                    codevalue *= 2;
                }
                return HT;
            }

            function initHuffmanTbl() {
                YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
                UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
                YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
                UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values);
            }

            function initCategoryNumber() {
                var nrlower = 1;
                var nrupper = 2;
                for (var cat = 1; cat <= 15; cat++) {
                    //Positive numbers
                    for (var nr = nrlower; nr < nrupper; nr++) {
                        category[32767 + nr] = cat;
                        bitcode[32767 + nr] = [];
                        bitcode[32767 + nr][1] = cat;
                        bitcode[32767 + nr][0] = nr;
                    }
                    //Negative numbers
                    for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
                        category[32767 + nrneg] = cat;
                        bitcode[32767 + nrneg] = [];
                        bitcode[32767 + nrneg][1] = cat;
                        bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
                    }
                    nrlower <<= 1;
                    nrupper <<= 1;
                }
            }

            function initRGBYUVTable() {
                for (var i = 0; i < 256; i++) {
                    RGB_YUV_TABLE[i] = 19595 * i;
                    RGB_YUV_TABLE[(i + 256) >> 0] = 38470 * i;
                    RGB_YUV_TABLE[(i + 512) >> 0] = 7471 * i + 0x8000;
                    RGB_YUV_TABLE[(i + 768) >> 0] = -11059 * i;
                    RGB_YUV_TABLE[(i + 1024) >> 0] = -21709 * i;
                    RGB_YUV_TABLE[(i + 1280) >> 0] = 32768 * i + 0x807FFF;
                    RGB_YUV_TABLE[(i + 1536) >> 0] = -27439 * i;
                    RGB_YUV_TABLE[(i + 1792) >> 0] = -5329 * i;
                }
            }

            // IO functions
            function writeBits(bs) {
                var value = bs[0];
                var posval = bs[1] - 1;
                while (posval >= 0) {
                    if (value & (1 << posval)) {
                        bytenew |= (1 << bytepos);
                    }
                    posval--;
                    bytepos--;
                    if (bytepos < 0) {
                        if (bytenew == 0xFF) {
                            writeByte(0xFF);
                            writeByte(0);
                        } else {
                            writeByte(bytenew);
                        }
                        bytepos = 7;
                        bytenew = 0;
                    }
                }
            }

            function writeByte(value) {
                byteout.push(clt[value]); // write char directly instead of converting later
            }

            function writeWord(value) {
                writeByte((value >> 8) & 0xFF);
                writeByte((value) & 0xFF);
            }

            // DCT & quantization core
            function fDCTQuant(data, fdtbl) {
                var d0, d1, d2, d3, d4, d5, d6, d7;
                /* Pass 1: process rows. */
                var dataOff = 0;
                var i;
                var I8 = 8;
                var I64 = 64;
                for (i = 0; i < I8; ++i) {
                    d0 = data[dataOff];
                    d1 = data[dataOff + 1];
                    d2 = data[dataOff + 2];
                    d3 = data[dataOff + 3];
                    d4 = data[dataOff + 4];
                    d5 = data[dataOff + 5];
                    d6 = data[dataOff + 6];
                    d7 = data[dataOff + 7];

                    var tmp0 = d0 + d7;
                    var tmp7 = d0 - d7;
                    var tmp1 = d1 + d6;
                    var tmp6 = d1 - d6;
                    var tmp2 = d2 + d5;
                    var tmp5 = d2 - d5;
                    var tmp3 = d3 + d4;
                    var tmp4 = d3 - d4;

                    /* Even part */
                    var tmp10 = tmp0 + tmp3;
                    /* phase 2 */
                    var tmp13 = tmp0 - tmp3;
                    var tmp11 = tmp1 + tmp2;
                    var tmp12 = tmp1 - tmp2;

                    data[dataOff] = tmp10 + tmp11;
                    /* phase 3 */
                    data[dataOff + 4] = tmp10 - tmp11;

                    var z1 = (tmp12 + tmp13) * 0.707106781;
                    /* c4 */
                    data[dataOff + 2] = tmp13 + z1;
                    /* phase 5 */
                    data[dataOff + 6] = tmp13 - z1;

                    /* Odd part */
                    tmp10 = tmp4 + tmp5;
                    /* phase 2 */
                    tmp11 = tmp5 + tmp6;
                    tmp12 = tmp6 + tmp7;

                    /* The rotator is modified from fig 4-8 to avoid extra negations. */
                    var z5 = (tmp10 - tmp12) * 0.382683433;
                    /* c6 */
                    var z2 = 0.541196100 * tmp10 + z5;
                    /* c2-c6 */
                    var z4 = 1.306562965 * tmp12 + z5;
                    /* c2+c6 */
                    var z3 = tmp11 * 0.707106781;
                    /* c4 */

                    var z11 = tmp7 + z3;
                    /* phase 5 */
                    var z13 = tmp7 - z3;

                    data[dataOff + 5] = z13 + z2;
                    /* phase 6 */
                    data[dataOff + 3] = z13 - z2;
                    data[dataOff + 1] = z11 + z4;
                    data[dataOff + 7] = z11 - z4;

                    dataOff += 8;
                    /* advance pointer to next row */
                }

                /* Pass 2: process columns. */
                dataOff = 0;
                for (i = 0; i < I8; ++i) {
                    d0 = data[dataOff];
                    d1 = data[dataOff + 8];
                    d2 = data[dataOff + 16];
                    d3 = data[dataOff + 24];
                    d4 = data[dataOff + 32];
                    d5 = data[dataOff + 40];
                    d6 = data[dataOff + 48];
                    d7 = data[dataOff + 56];

                    var tmp0p2 = d0 + d7;
                    var tmp7p2 = d0 - d7;
                    var tmp1p2 = d1 + d6;
                    var tmp6p2 = d1 - d6;
                    var tmp2p2 = d2 + d5;
                    var tmp5p2 = d2 - d5;
                    var tmp3p2 = d3 + d4;
                    var tmp4p2 = d3 - d4;

                    /* Even part */
                    var tmp10p2 = tmp0p2 + tmp3p2;
                    /* phase 2 */
                    var tmp13p2 = tmp0p2 - tmp3p2;
                    var tmp11p2 = tmp1p2 + tmp2p2;
                    var tmp12p2 = tmp1p2 - tmp2p2;

                    data[dataOff] = tmp10p2 + tmp11p2;
                    /* phase 3 */
                    data[dataOff + 32] = tmp10p2 - tmp11p2;

                    var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781;
                    /* c4 */
                    data[dataOff + 16] = tmp13p2 + z1p2;
                    /* phase 5 */
                    data[dataOff + 48] = tmp13p2 - z1p2;

                    /* Odd part */
                    tmp10p2 = tmp4p2 + tmp5p2;
                    /* phase 2 */
                    tmp11p2 = tmp5p2 + tmp6p2;
                    tmp12p2 = tmp6p2 + tmp7p2;

                    /* The rotator is modified from fig 4-8 to avoid extra negations. */
                    var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433;
                    /* c6 */
                    var z2p2 = 0.541196100 * tmp10p2 + z5p2;
                    /* c2-c6 */
                    var z4p2 = 1.306562965 * tmp12p2 + z5p2;
                    /* c2+c6 */
                    var z3p2 = tmp11p2 * 0.707106781;
                    /* c4 */

                    var z11p2 = tmp7p2 + z3p2;
                    /* phase 5 */
                    var z13p2 = tmp7p2 - z3p2;

                    data[dataOff + 40] = z13p2 + z2p2;
                    /* phase 6 */
                    data[dataOff + 24] = z13p2 - z2p2;
                    data[dataOff + 8] = z11p2 + z4p2;
                    data[dataOff + 56] = z11p2 - z4p2;

                    dataOff++;
                    /* advance pointer to next column */
                }

                // Quantize/descale the coefficients
                var fDCTQuant;
                for (i = 0; i < I64; ++i) {
                    // Apply the quantization and scaling factor & Round to nearest integer
                    fDCTQuant = data[i] * fdtbl[i];
                    outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5) | 0) : ((fDCTQuant - 0.5) | 0);
                    //outputfDCTQuant[i] = fround(fDCTQuant);

                }
                return outputfDCTQuant;
            }

            function writeAPP0() {
                writeWord(0xFFE0); // marker
                writeWord(16); // length
                writeByte(0x4A); // J
                writeByte(0x46); // F
                writeByte(0x49); // I
                writeByte(0x46); // F
                writeByte(0); // = "JFIF",'\0'
                writeByte(1); // versionhi
                writeByte(1); // versionlo
                writeByte(0); // xyunits
                writeWord(1); // xdensity
                writeWord(1); // ydensity
                writeByte(0); // thumbnwidth
                writeByte(0); // thumbnheight
            }

            function writeSOF0(width, height) {
                writeWord(0xFFC0); // marker
                writeWord(17); // length, truecolor YUV JPG
                writeByte(8); // precision
                writeWord(height);
                writeWord(width);
                writeByte(3); // nrofcomponents
                writeByte(1); // IdY
                writeByte(0x11); // HVY
                writeByte(0); // QTY
                writeByte(2); // IdU
                writeByte(0x11); // HVU
                writeByte(1); // QTU
                writeByte(3); // IdV
                writeByte(0x11); // HVV
                writeByte(1); // QTV
            }

            function writeDQT() {
                writeWord(0xFFDB); // marker
                writeWord(132); // length
                writeByte(0);
                for (var i = 0; i < 64; i++) {
                    writeByte(YTable[i]);
                }
                writeByte(1);
                for (var j = 0; j < 64; j++) {
                    writeByte(UVTable[j]);
                }
            }

            function writeDHT() {
                writeWord(0xFFC4); // marker
                writeWord(0x01A2); // length

                writeByte(0); // HTYDCinfo
                for (var i = 0; i < 16; i++) {
                    writeByte(std_dc_luminance_nrcodes[i + 1]);
                }
                for (var j = 0; j <= 11; j++) {
                    writeByte(std_dc_luminance_values[j]);
                }

                writeByte(0x10); // HTYACinfo
                for (var k = 0; k < 16; k++) {
                    writeByte(std_ac_luminance_nrcodes[k + 1]);
                }
                for (var l = 0; l <= 161; l++) {
                    writeByte(std_ac_luminance_values[l]);
                }

                writeByte(1); // HTUDCinfo
                for (var m = 0; m < 16; m++) {
                    writeByte(std_dc_chrominance_nrcodes[m + 1]);
                }
                for (var n = 0; n <= 11; n++) {
                    writeByte(std_dc_chrominance_values[n]);
                }

                writeByte(0x11); // HTUACinfo
                for (var o = 0; o < 16; o++) {
                    writeByte(std_ac_chrominance_nrcodes[o + 1]);
                }
                for (var p = 0; p <= 161; p++) {
                    writeByte(std_ac_chrominance_values[p]);
                }
            }

            function writeSOS() {
                writeWord(0xFFDA); // marker
                writeWord(12); // length
                writeByte(3); // nrofcomponents
                writeByte(1); // IdY
                writeByte(0); // HTY
                writeByte(2); // IdU
                writeByte(0x11); // HTU
                writeByte(3); // IdV
                writeByte(0x11); // HTV
                writeByte(0); // Ss
                writeByte(0x3f); // Se
                writeByte(0); // Bf
            }

            function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
                var EOB = HTAC[0x00];
                var M16zeroes = HTAC[0xF0];
                var pos;
                var I16 = 16;
                var I63 = 63;
                var I64 = 64;
                var DU_DCT = fDCTQuant(CDU, fdtbl);
                //ZigZag reorder
                for (var j = 0; j < I64; ++j) {
                    DU[ZigZag[j]] = DU_DCT[j];
                }
                var Diff = DU[0] - DC;
                DC = DU[0];
                //Encode DC
                if (Diff == 0) {
                    writeBits(HTDC[0]); // Diff might be 0
                } else {
                    pos = 32767 + Diff;
                    writeBits(HTDC[category[pos]]);
                    writeBits(bitcode[pos]);
                }
                //Encode ACs
                var end0pos = 63; // was const... which is crazy
                for (;
                    (end0pos > 0) && (DU[end0pos] == 0); end0pos--) {
                }
                ;
                //end0pos = first element in reverse order !=0
                if (end0pos == 0) {
                    writeBits(EOB);
                    return DC;
                }
                var i = 1;
                var lng;
                while (i <= end0pos) {
                    var startpos = i;
                    for (;
                        (DU[i] == 0) && (i <= end0pos); ++i) {
                    }
                    var nrzeroes = i - startpos;
                    if (nrzeroes >= I16) {
                        lng = nrzeroes >> 4;
                        for (var nrmarker = 1; nrmarker <= lng; ++nrmarker)
                            writeBits(M16zeroes);
                        nrzeroes = nrzeroes & 0xF;
                    }
                    pos = 32767 + DU[i];
                    writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
                    writeBits(bitcode[pos]);
                    i++;
                }
                if (end0pos != I63) {
                    writeBits(EOB);
                }
                return DC;
            }

            function initCharLookupTable() {
                var sfcc = String.fromCharCode;
                for (var i = 0; i < 256; i++) { ///// ACHTUNG // 255
                    clt[i] = sfcc(i);
                }
            }

            this.encode = function (image, quality) // image data object
            {
                var time_start = new Date().getTime();

                if (quality) setQuality(quality);

                // Initialize bit writer
                byteout = new Array();
                bytenew = 0;
                bytepos = 7;

                // Add JPEG headers
                writeWord(0xFFD8); // SOI
                writeAPP0();
                writeDQT();
                writeSOF0(image.width, image.height);
                writeDHT();
                writeSOS();


                // Encode 8x8 macroblocks
                var DCY = 0;
                var DCU = 0;
                var DCV = 0;

                bytenew = 0;
                bytepos = 7;


                this.encode.displayName = "_encode_";

                var imageData = image.data;
                var width = image.width;
                var height = image.height;

                var quadWidth = width * 4;
                var tripleWidth = width * 3;

                var x, y = 0;
                var r, g, b;
                var start, p, col, row, pos;
                while (y < height) {
                    x = 0;
                    while (x < quadWidth) {
                        start = quadWidth * y + x;
                        p = start;
                        col = -1;
                        row = 0;

                        for (pos = 0; pos < 64; pos++) {
                            row = pos >> 3; // /8
                            col = (pos & 7) * 4; // %8
                            p = start + (row * quadWidth) + col;

                            if (y + row >= height) { // padding bottom
                                p -= (quadWidth * (y + 1 + row - height));
                            }

                            if (x + col >= quadWidth) { // padding right
                                p -= ((x + col) - quadWidth + 4)
                            }

                            r = imageData[p++];
                            g = imageData[p++];
                            b = imageData[p++];


                            /* // calculate YUV values dynamically
                             YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
                             UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
                             VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
                             */

                            // use lookup table (slightly faster)
                            YDU[pos] = ((RGB_YUV_TABLE[r] + RGB_YUV_TABLE[(g + 256) >> 0] + RGB_YUV_TABLE[(b + 512) >> 0]) >> 16) - 128;
                            UDU[pos] = ((RGB_YUV_TABLE[(r + 768) >> 0] + RGB_YUV_TABLE[(g + 1024) >> 0] + RGB_YUV_TABLE[(b + 1280) >> 0]) >> 16) - 128;
                            VDU[pos] = ((RGB_YUV_TABLE[(r + 1280) >> 0] + RGB_YUV_TABLE[(g + 1536) >> 0] + RGB_YUV_TABLE[(b + 1792) >> 0]) >> 16) - 128;

                        }

                        DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
                        DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
                        DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
                        x += 32;
                    }
                    y += 8;
                }


                ////////////////////////////////////////////////////////////////

                // Do the bit alignment of the EOI marker
                if (bytepos >= 0) {
                    var fillbits = [];
                    fillbits[1] = bytepos + 1;
                    fillbits[0] = (1 << (bytepos + 1)) - 1;
                    writeBits(fillbits);
                }

                writeWord(0xFFD9); //EOI

                var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));

                byteout = [];

                // benchmarking
                var duration = new Date().getTime() - time_start;
                console.log('Encoding time: ' + duration + 'ms');
                //

                return jpegDataUri
            }

            function setQuality(quality) {
                if (quality <= 0) {
                    quality = 1;
                }
                if (quality > 100) {
                    quality = 100;
                }

                if (currentQuality == quality) return // don't recalc if unchanged

                var sf = 0;
                if (quality < 50) {
                    sf = Math.floor(5000 / quality);
                } else {
                    sf = Math.floor(200 - quality * 2);
                }

                initQuantTables(sf);
                currentQuality = quality;
                console.log('Quality set to: ' + quality + '%');
            }

            function init() {
                var time_start = new Date().getTime();
                if (!quality) quality = 50;
                // Create tables
                initCharLookupTable()
                initHuffmanTbl();
                initCategoryNumber();
                initRGBYUVTable();

                setQuality(quality);
                var duration = new Date().getTime() - time_start;
                console.log('Initialization ' + duration + 'ms');
            }

            init();

        };

        // helper function to get the imageData of an existing image on the current page.
        function getImageDataFromImage(idOrElement) {
            var theImg = (typeof(idOrElement) == 'string') ? document.getElementById(idOrElement) : idOrElement;
            var cvs = document.createElement('canvas');
            cvs.width = theImg.width;
            cvs.height = theImg.height;
            var ctx = cvs.getContext("2d");
            ctx.drawImage(theImg, 0, 0);

            return (ctx.getImageData(0, 0, cvs.width, cvs.height));
        }

        /*

         function init(qu){
         var theImg = document.getElementById('testimage');
         var cvs = document.createElement('canvas');
         cvs.width = theImg.width;
         cvs.height = theImg.height;

         //document.body.appendChild(cvs);

         var ctx = cvs.getContext("2d");

         ctx.drawImage(theImg,0,0);

         var theImgData = (ctx.getImageData(0, 0, cvs.width, cvs.height));


         var jpegURI = encoder.encode(theImgData,qu);

         var img = document.createElement('img');
         img.src = jpegURI;
         document.body.appendChild(img);
         }
         */


        window.JPEGEncoder = JPEGEncoder;

    })();

    /*===================filePath:[src/resource/exif.js]======================*/
    (function () {

        /*
         * Javascript EXIF Reader 0.1.4
         * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
         * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
         */


        window.EXIF = {};

        (function () {

            var bDebug = false;

            EXIF.Tags = {

                // version tags
                0x9000: "ExifVersion", // EXIF version
                0xA000: "FlashpixVersion", // Flashpix format version

                // colorspace tags
                0xA001: "ColorSpace", // Color space information tag

                // image configuration
                0xA002: "PixelXDimension", // Valid width of meaningful image
                0xA003: "PixelYDimension", // Valid height of meaningful image
                0x9101: "ComponentsConfiguration", // Information about channels
                0x9102: "CompressedBitsPerPixel", // Compressed bits per pixel

                // user information
                0x927C: "MakerNote", // Any desired information written by the manufacturer
                0x9286: "UserComment", // Comments by user

                // related file
                0xA004: "RelatedSoundFile", // Name of related sound file

                // date and time
                0x9003: "DateTimeOriginal", // Date and time when the original image was generated
                0x9004: "DateTimeDigitized", // Date and time when the image was stored digitally
                0x9290: "SubsecTime", // Fractions of seconds for DateTime
                0x9291: "SubsecTimeOriginal", // Fractions of seconds for DateTimeOriginal
                0x9292: "SubsecTimeDigitized", // Fractions of seconds for DateTimeDigitized

                // picture-taking conditions
                0x829A: "ExposureTime", // Exposure time (in seconds)
                0x829D: "FNumber", // F number
                0x8822: "ExposureProgram", // Exposure program
                0x8824: "SpectralSensitivity", // Spectral sensitivity
                0x8827: "ISOSpeedRatings", // ISO speed rating
                0x8828: "OECF", // Optoelectric conversion factor
                0x9201: "ShutterSpeedValue", // Shutter speed
                0x9202: "ApertureValue", // Lens aperture
                0x9203: "BrightnessValue", // Value of brightness
                0x9204: "ExposureBias", // Exposure bias
                0x9205: "MaxApertureValue", // Smallest F number of lens
                0x9206: "SubjectDistance", // Distance to subject in meters
                0x9207: "MeteringMode", // Metering mode
                0x9208: "LightSource", // Kind of light source
                0x9209: "Flash", // Flash status
                0x9214: "SubjectArea", // Location and area of main subject
                0x920A: "FocalLength", // Focal length of the lens in mm
                0xA20B: "FlashEnergy", // Strobe energy in BCPS
                0xA20C: "SpatialFrequencyResponse", //
                0xA20E: "FocalPlaneXResolution", // Number of pixels in width direction per FocalPlaneResolutionUnit
                0xA20F: "FocalPlaneYResolution", // Number of pixels in height direction per FocalPlaneResolutionUnit
                0xA210: "FocalPlaneResolutionUnit", // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
                0xA214: "SubjectLocation", // Location of subject in image
                0xA215: "ExposureIndex", // Exposure index selected on camera
                0xA217: "SensingMethod", // Image sensor type
                0xA300: "FileSource", // Image source (3 == DSC)
                0xA301: "SceneType", // Scene type (1 == directly photographed)
                0xA302: "CFAPattern", // Color filter array geometric pattern
                0xA401: "CustomRendered", // Special processing
                0xA402: "ExposureMode", // Exposure mode
                0xA403: "WhiteBalance", // 1 = auto white balance, 2 = manual
                0xA404: "DigitalZoomRation", // Digital zoom ratio
                0xA405: "FocalLengthIn35mmFilm", // Equivalent foacl length assuming 35mm film camera (in mm)
                0xA406: "SceneCaptureType", // Type of scene
                0xA407: "GainControl", // Degree of overall image gain adjustment
                0xA408: "Contrast", // Direction of contrast processing applied by camera
                0xA409: "Saturation", // Direction of saturation processing applied by camera
                0xA40A: "Sharpness", // Direction of sharpness processing applied by camera
                0xA40B: "DeviceSettingDescription", //
                0xA40C: "SubjectDistanceRange", // Distance to subject

                // other tags
                0xA005: "InteroperabilityIFDPointer",
                0xA420: "ImageUniqueID" // Identifier assigned uniquely to each image
            };

            EXIF.TiffTags = {
                0x0100: "ImageWidth",
                0x0101: "ImageHeight",
                0x8769: "ExifIFDPointer",
                0x8825: "GPSInfoIFDPointer",
                0xA005: "InteroperabilityIFDPointer",
                0x0102: "BitsPerSample",
                0x0103: "Compression",
                0x0106: "PhotometricInterpretation",
                0x0112: "Orientation",
                0x0115: "SamplesPerPixel",
                0x011C: "PlanarConfiguration",
                0x0212: "YCbCrSubSampling",
                0x0213: "YCbCrPositioning",
                0x011A: "XResolution",
                0x011B: "YResolution",
                0x0128: "ResolutionUnit",
                0x0111: "StripOffsets",
                0x0116: "RowsPerStrip",
                0x0117: "StripByteCounts",
                0x0201: "JPEGInterchangeFormat",
                0x0202: "JPEGInterchangeFormatLength",
                0x012D: "TransferFunction",
                0x013E: "WhitePoint",
                0x013F: "PrimaryChromaticities",
                0x0211: "YCbCrCoefficients",
                0x0214: "ReferenceBlackWhite",
                0x0132: "DateTime",
                0x010E: "ImageDescription",
                0x010F: "Make",
                0x0110: "Model",
                0x0131: "Software",
                0x013B: "Artist",
                0x8298: "Copyright"
            }

            EXIF.GPSTags = {
                0x0000: "GPSVersionID",
                0x0001: "GPSLatitudeRef",
                0x0002: "GPSLatitude",
                0x0003: "GPSLongitudeRef",
                0x0004: "GPSLongitude",
                0x0005: "GPSAltitudeRef",
                0x0006: "GPSAltitude",
                0x0007: "GPSTimeStamp",
                0x0008: "GPSSatellites",
                0x0009: "GPSStatus",
                0x000A: "GPSMeasureMode",
                0x000B: "GPSDOP",
                0x000C: "GPSSpeedRef",
                0x000D: "GPSSpeed",
                0x000E: "GPSTrackRef",
                0x000F: "GPSTrack",
                0x0010: "GPSImgDirectionRef",
                0x0011: "GPSImgDirection",
                0x0012: "GPSMapDatum",
                0x0013: "GPSDestLatitudeRef",
                0x0014: "GPSDestLatitude",
                0x0015: "GPSDestLongitudeRef",
                0x0016: "GPSDestLongitude",
                0x0017: "GPSDestBearingRef",
                0x0018: "GPSDestBearing",
                0x0019: "GPSDestDistanceRef",
                0x001A: "GPSDestDistance",
                0x001B: "GPSProcessingMethod",
                0x001C: "GPSAreaInformation",
                0x001D: "GPSDateStamp",
                0x001E: "GPSDifferential"
            }

            EXIF.StringValues = {
                ExposureProgram: {
                    0: "Not defined",
                    1: "Manual",
                    2: "Normal program",
                    3: "Aperture priority",
                    4: "Shutter priority",
                    5: "Creative program",
                    6: "Action program",
                    7: "Portrait mode",
                    8: "Landscape mode"
                },
                MeteringMode: {
                    0: "Unknown",
                    1: "Average",
                    2: "CenterWeightedAverage",
                    3: "Spot",
                    4: "MultiSpot",
                    5: "Pattern",
                    6: "Partial",
                    255: "Other"
                },
                LightSource: {
                    0: "Unknown",
                    1: "Daylight",
                    2: "Fluorescent",
                    3: "Tungsten (incandescent light)",
                    4: "Flash",
                    9: "Fine weather",
                    10: "Cloudy weather",
                    11: "Shade",
                    12: "Daylight fluorescent (D 5700 - 7100K)",
                    13: "Day white fluorescent (N 4600 - 5400K)",
                    14: "Cool white fluorescent (W 3900 - 4500K)",
                    15: "White fluorescent (WW 3200 - 3700K)",
                    17: "Standard light A",
                    18: "Standard light B",
                    19: "Standard light C",
                    20: "D55",
                    21: "D65",
                    22: "D75",
                    23: "D50",
                    24: "ISO studio tungsten",
                    255: "Other"
                },
                Flash: {
                    0x0000: "Flash did not fire",
                    0x0001: "Flash fired",
                    0x0005: "Strobe return light not detected",
                    0x0007: "Strobe return light detected",
                    0x0009: "Flash fired, compulsory flash mode",
                    0x000D: "Flash fired, compulsory flash mode, return light not detected",
                    0x000F: "Flash fired, compulsory flash mode, return light detected",
                    0x0010: "Flash did not fire, compulsory flash mode",
                    0x0018: "Flash did not fire, auto mode",
                    0x0019: "Flash fired, auto mode",
                    0x001D: "Flash fired, auto mode, return light not detected",
                    0x001F: "Flash fired, auto mode, return light detected",
                    0x0020: "No flash function",
                    0x0041: "Flash fired, red-eye reduction mode",
                    0x0045: "Flash fired, red-eye reduction mode, return light not detected",
                    0x0047: "Flash fired, red-eye reduction mode, return light detected",
                    0x0049: "Flash fired, compulsory flash mode, red-eye reduction mode",
                    0x004D: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
                    0x004F: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
                    0x0059: "Flash fired, auto mode, red-eye reduction mode",
                    0x005D: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
                    0x005F: "Flash fired, auto mode, return light detected, red-eye reduction mode"
                },
                SensingMethod: {
                    1: "Not defined",
                    2: "One-chip color area sensor",
                    3: "Two-chip color area sensor",
                    4: "Three-chip color area sensor",
                    5: "Color sequential area sensor",
                    7: "Trilinear sensor",
                    8: "Color sequential linear sensor"
                },
                SceneCaptureType: {
                    0: "Standard",
                    1: "Landscape",
                    2: "Portrait",
                    3: "Night scene"
                },
                SceneType: {
                    1: "Directly photographed"
                },
                CustomRendered: {
                    0: "Normal process",
                    1: "Custom process"
                },
                WhiteBalance: {
                    0: "Auto white balance",
                    1: "Manual white balance"
                },
                GainControl: {
                    0: "None",
                    1: "Low gain up",
                    2: "High gain up",
                    3: "Low gain down",
                    4: "High gain down"
                },
                Contrast: {
                    0: "Normal",
                    1: "Soft",
                    2: "Hard"
                },
                Saturation: {
                    0: "Normal",
                    1: "Low saturation",
                    2: "High saturation"
                },
                Sharpness: {
                    0: "Normal",
                    1: "Soft",
                    2: "Hard"
                },
                SubjectDistanceRange: {
                    0: "Unknown",
                    1: "Macro",
                    2: "Close view",
                    3: "Distant view"
                },
                FileSource: {
                    3: "DSC"
                },

                Components: {
                    0: "",
                    1: "Y",
                    2: "Cb",
                    3: "Cr",
                    4: "R",
                    5: "G",
                    6: "B"
                }
            }

            function addEvent(oElement, strEvent, fncHandler) {
                if (oElement.addEventListener) {
                    oElement.addEventListener(strEvent, fncHandler, false);
                } else if (oElement.attachEvent) {
                    oElement.attachEvent("on" + strEvent, fncHandler);
                }
            }


            function imageHasData(oImg) {
                return !!(oImg.exifdata);
            }

            function getImageData(oImg, fncCallback) {
                BinaryAjax(
                    oImg.src,
                    function (oHTTP) {
                        var oEXIF = findEXIFinJPEG(oHTTP.binaryResponse);
                        oImg.exifdata = oEXIF || {};
                        if (fncCallback) fncCallback();
                    }
                )
            }

            function findEXIFinJPEG(oFile) {
                var aMarkers = [];

                if (oFile.getByteAt(0) != 0xFF || oFile.getByteAt(1) != 0xD8) {
                    return false; // not a valid jpeg
                }

                var iOffset = 2;
                var iLength = oFile.getLength();
                while (iOffset < iLength) {
                    if (oFile.getByteAt(iOffset) != 0xFF) {
                        if (bDebug) console.log("Not a valid marker at offset " + iOffset + ", found: " + oFile.getByteAt(iOffset));
                        return false; // not a valid marker, something is wrong
                    }

                    var iMarker = oFile.getByteAt(iOffset + 1);

                    // we could implement handling for other markers here,
                    // but we're only looking for 0xFFE1 for EXIF data

                    if (iMarker == 22400) {
                        if (bDebug) console.log("Found 0xFFE1 marker");
                        return readEXIFData(oFile, iOffset + 4, oFile.getShortAt(iOffset + 2, true) - 2);
                        iOffset += 2 + oFile.getShortAt(iOffset + 2, true);

                    } else if (iMarker == 225) {
                        // 0xE1 = Application-specific 1 (for EXIF)
                        if (bDebug) console.log("Found 0xFFE1 marker");
                        return readEXIFData(oFile, iOffset + 4, oFile.getShortAt(iOffset + 2, true) - 2);

                    } else {
                        iOffset += 2 + oFile.getShortAt(iOffset + 2, true);
                    }

                }

            }


            function readTags(oFile, iTIFFStart, iDirStart, oStrings, bBigEnd) {
                var iEntries = oFile.getShortAt(iDirStart, bBigEnd);
                var oTags = {};
                for (var i = 0; i < iEntries; i++) {
                    var iEntryOffset = iDirStart + i * 12 + 2;
                    var strTag = oStrings[oFile.getShortAt(iEntryOffset, bBigEnd)];
                    if (!strTag && bDebug) console.log("Unknown tag: " + oFile.getShortAt(iEntryOffset, bBigEnd));
                    oTags[strTag] = readTagValue(oFile, iEntryOffset, iTIFFStart, iDirStart, bBigEnd);
                }
                return oTags;
            }


            function readTagValue(oFile, iEntryOffset, iTIFFStart, iDirStart, bBigEnd) {
                var iType = oFile.getShortAt(iEntryOffset + 2, bBigEnd);
                var iNumValues = oFile.getLongAt(iEntryOffset + 4, bBigEnd);
                var iValueOffset = oFile.getLongAt(iEntryOffset + 8, bBigEnd) + iTIFFStart;

                switch (iType) {
                    case 1: // byte, 8-bit unsigned int
                    case 7: // undefined, 8-bit byte, value depending on field
                        if (iNumValues == 1) {
                            return oFile.getByteAt(iEntryOffset + 8, bBigEnd);
                        } else {
                            var iValOffset = iNumValues > 4 ? iValueOffset : (iEntryOffset + 8);
                            var aVals = [];
                            for (var n = 0; n < iNumValues; n++) {
                                aVals[n] = oFile.getByteAt(iValOffset + n);
                            }
                            return aVals;
                        }
                        break;

                    case 2: // ascii, 8-bit byte
                        var iStringOffset = iNumValues > 4 ? iValueOffset : (iEntryOffset + 8);
                        return oFile.getStringAt(iStringOffset, iNumValues - 1);
                        break;

                    case 3: // short, 16 bit int
                        if (iNumValues == 1) {
                            return oFile.getShortAt(iEntryOffset + 8, bBigEnd);
                        } else {
                            var iValOffset = iNumValues > 2 ? iValueOffset : (iEntryOffset + 8);
                            var aVals = [];
                            for (var n = 0; n < iNumValues; n++) {
                                aVals[n] = oFile.getShortAt(iValOffset + 2 * n, bBigEnd);
                            }
                            return aVals;
                        }
                        break;

                    case 4: // long, 32 bit int
                        if (iNumValues == 1) {
                            return oFile.getLongAt(iEntryOffset + 8, bBigEnd);
                        } else {
                            var aVals = [];
                            for (var n = 0; n < iNumValues; n++) {
                                aVals[n] = oFile.getLongAt(iValueOffset + 4 * n, bBigEnd);
                            }
                            return aVals;
                        }
                        break;
                    case 5: // rational = two long values, first is numerator, second is denominator
                        if (iNumValues == 1) {
                            return oFile.getLongAt(iValueOffset, bBigEnd) / oFile.getLongAt(iValueOffset + 4, bBigEnd);
                        } else {
                            var aVals = [];
                            for (var n = 0; n < iNumValues; n++) {
                                aVals[n] = oFile.getLongAt(iValueOffset + 8 * n, bBigEnd) / oFile.getLongAt(iValueOffset + 4 + 8 * n, bBigEnd);
                            }
                            return aVals;
                        }
                        break;
                    case 9: // slong, 32 bit signed int
                        if (iNumValues == 1) {
                            return oFile.getSLongAt(iEntryOffset + 8, bBigEnd);
                        } else {
                            var aVals = [];
                            for (var n = 0; n < iNumValues; n++) {
                                aVals[n] = oFile.getSLongAt(iValueOffset + 4 * n, bBigEnd);
                            }
                            return aVals;
                        }
                        break;
                    case 10: // signed rational, two slongs, first is numerator, second is denominator
                        if (iNumValues == 1) {
                            return oFile.getSLongAt(iValueOffset, bBigEnd) / oFile.getSLongAt(iValueOffset + 4, bBigEnd);
                        } else {
                            var aVals = [];
                            for (var n = 0; n < iNumValues; n++) {
                                aVals[n] = oFile.getSLongAt(iValueOffset + 8 * n, bBigEnd) / oFile.getSLongAt(iValueOffset + 4 + 8 * n, bBigEnd);
                            }
                            return aVals;
                        }
                        break;
                }
            }


            function readEXIFData(oFile, iStart, iLength) {
                if (oFile.getStringAt(iStart, 4) != "Exif") {
                    if (bDebug) console.log("Not valid EXIF data! " + oFile.getStringAt(iStart, 4));
                    return false;
                }

                var bBigEnd;

                var iTIFFOffset = iStart + 6;

                // test for TIFF validity and endianness
                if (oFile.getShortAt(iTIFFOffset) == 0x4949) {
                    bBigEnd = false;
                } else if (oFile.getShortAt(iTIFFOffset) == 0x4D4D) {
                    bBigEnd = true;
                } else {
                    if (bDebug) console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
                    return false;
                }

                if (oFile.getShortAt(iTIFFOffset + 2, bBigEnd) != 0x002A) {
                    if (bDebug) console.log("Not valid TIFF data! (no 0x002A)");
                    return false;
                }

                if (oFile.getLongAt(iTIFFOffset + 4, bBigEnd) != 0x00000008) {
                    if (bDebug) console.log("Not valid TIFF data! (First offset not 8)", oFile.getShortAt(iTIFFOffset + 4, bBigEnd));
                    return false;
                }

                var oTags = readTags(oFile, iTIFFOffset, iTIFFOffset + 8, EXIF.TiffTags, bBigEnd);

                if (oTags.ExifIFDPointer) {
                    var oEXIFTags = readTags(oFile, iTIFFOffset, iTIFFOffset + oTags.ExifIFDPointer, EXIF.Tags, bBigEnd);
                    for (var strTag in oEXIFTags) {
                        switch (strTag) {
                            case "LightSource":
                            case "Flash":
                            case "MeteringMode":
                            case "ExposureProgram":
                            case "SensingMethod":
                            case "SceneCaptureType":
                            case "SceneType":
                            case "CustomRendered":
                            case "WhiteBalance":
                            case "GainControl":
                            case "Contrast":
                            case "Saturation":
                            case "Sharpness":
                            case "SubjectDistanceRange":
                            case "FileSource":
                                oEXIFTags[strTag] = EXIF.StringValues[strTag][oEXIFTags[strTag]];
                                break;

                            case "ExifVersion":
                            case "FlashpixVersion":
                                oEXIFTags[strTag] = String.fromCharCode(oEXIFTags[strTag][0], oEXIFTags[strTag][1], oEXIFTags[strTag][2], oEXIFTags[strTag][3]);
                                break;

                            case "ComponentsConfiguration":
                                oEXIFTags[strTag] =
                                    EXIF.StringValues.Components[oEXIFTags[strTag][0]] + EXIF.StringValues.Components[oEXIFTags[strTag][1]] + EXIF.StringValues.Components[oEXIFTags[strTag][2]] + EXIF.StringValues.Components[oEXIFTags[strTag][3]];
                                break;
                        }
                        oTags[strTag] = oEXIFTags[strTag];
                    }
                }

                if (oTags.GPSInfoIFDPointer) {
                    var oGPSTags = readTags(oFile, iTIFFOffset, iTIFFOffset + oTags.GPSInfoIFDPointer, EXIF.GPSTags, bBigEnd);
                    for (var strTag in oGPSTags) {
                        switch (strTag) {
                            case "GPSVersionID":
                                oGPSTags[strTag] = oGPSTags[strTag][0] + "." + oGPSTags[strTag][1] + "." + oGPSTags[strTag][2] + "." + oGPSTags[strTag][3];
                                break;
                        }
                        oTags[strTag] = oGPSTags[strTag];
                    }
                }

                return oTags;
            }


            EXIF.getData = function (oImg, fncCallback) {
                if (!oImg.complete) return false;
                if (!imageHasData(oImg)) {
                    getImageData(oImg, fncCallback);
                } else {
                    if (fncCallback) fncCallback();
                }
                return true;
            }

            EXIF.getTag = function (oImg, strTag) {
                if (!imageHasData(oImg)) return;
                return oImg.exifdata[strTag];
            }

            EXIF.getAllTags = function (oImg) {
                if (!imageHasData(oImg)) return {};
                var oData = oImg.exifdata;
                var oAllTags = {};
                for (var a in oData) {
                    if (oData.hasOwnProperty(a)) {
                        oAllTags[a] = oData[a];
                    }
                }
                return oAllTags;
            }


            EXIF.pretty = function (oImg) {
                if (!imageHasData(oImg)) return "";
                var oData = oImg.exifdata;
                var strPretty = "";
                for (var a in oData) {
                    if (oData.hasOwnProperty(a)) {
                        if (typeof oData[a] == "object") {
                            strPretty += a + " : [" + oData[a].length + " values]\r\n";
                        } else {
                            strPretty += a + " : " + oData[a] + "\r\n";
                        }
                    }
                }
                return strPretty;
            }

            EXIF.readFromBinaryFile = function (oFile) {
                return findEXIFinJPEG(oFile);
            }

            function loadAllImages() {
                var aImages = document.getElementsByTagName("img");
                for (var i = 0; i < aImages.length; i++) {
                    if (aImages[i].getAttribute("exif") == "true") {
                        if (!aImages[i].complete) {
                            addEvent(aImages[i], "load",
                                function () {
                                    EXIF.getData(this);
                                }
                            );
                        } else {
                            EXIF.getData(aImages[i]);
                        }
                    }
                }
            }

            addEvent(window, "load", loadAllImages);

        })();


    })();

    /*===================filePath:[src/resource/binaryajax.js]======================*/
    (function () {
        /*
         * Binary Ajax 0.1.10
         * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
         * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
         */


        window.BinaryFile = function (strData, iDataOffset, iDataLength) {
            var data = strData;
            var dataOffset = iDataOffset || 0;
            var dataLength = 0;

            this.getRawData = function () {
                return data;
            }

            if (typeof strData == "string") {
                dataLength = iDataLength || data.length;

                this.getByteAt = function (iOffset) {
                    return data.charCodeAt(iOffset + dataOffset) & 0xFF;
                }

                this.getBytesAt = function (iOffset, iLength) {
                    var aBytes = [];

                    for (var i = 0; i < iLength; i++) {
                        aBytes[i] = data.charCodeAt((iOffset + i) + dataOffset) & 0xFF
                    }
                    ;

                    return aBytes;
                }
            } else if (typeof strData == "unknown") {
                dataLength = iDataLength || IEBinary_getLength(data);

                this.getByteAt = function (iOffset) {
                    return IEBinary_getByteAt(data, iOffset + dataOffset);
                }

                this.getBytesAt = function (iOffset, iLength) {
                    return new VBArray(IEBinary_getBytesAt(data, iOffset + dataOffset, iLength)).toArray();
                }
            }

            this.getLength = function () {
                return dataLength;
            }

            this.getSByteAt = function (iOffset) {
                var iByte = this.getByteAt(iOffset);
                if (iByte > 127)
                    return iByte - 256;
                else
                    return iByte;
            }

            this.getShortAt = function (iOffset, bBigEndian) {
                var iShort = bBigEndian ?
                    (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1) : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
                if (iShort < 0) iShort += 65536;
                return iShort;
            }
            this.getSShortAt = function (iOffset, bBigEndian) {
                var iUShort = this.getShortAt(iOffset, bBigEndian);
                if (iUShort > 32767)
                    return iUShort - 65536;
                else
                    return iUShort;
            }
            this.getLongAt = function (iOffset, bBigEndian) {
                var iByte1 = this.getByteAt(iOffset),
                    iByte2 = this.getByteAt(iOffset + 1),
                    iByte3 = this.getByteAt(iOffset + 2),
                    iByte4 = this.getByteAt(iOffset + 3);

                var iLong = bBigEndian ?
                    (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4 : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
                if (iLong < 0) iLong += 4294967296;
                return iLong;
            }
            this.getSLongAt = function (iOffset, bBigEndian) {
                var iULong = this.getLongAt(iOffset, bBigEndian);
                if (iULong > 2147483647)
                    return iULong - 4294967296;
                else
                    return iULong;
            }

            this.getStringAt = function (iOffset, iLength) {
                var aStr = [];

                var aBytes = this.getBytesAt(iOffset, iLength);
                for (var j = 0; j < iLength; j++) {
                    aStr[j] = String.fromCharCode(aBytes[j]);
                }
                return aStr.join("");
            }

            this.getCharAt = function (iOffset) {
                return String.fromCharCode(this.getByteAt(iOffset));
            }
            this.toBase64 = function () {
                return window.btoa(data);
            }
            this.fromBase64 = function (strBase64) {
                data = window.atob(strBase64);
            }
        }


        var BinaryAjax = (function () {

            function createRequest() {
                var oHTTP = null;
                if (window.ActiveXObject) {
                    oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
                } else if (window.XMLHttpRequest) {
                    oHTTP = new XMLHttpRequest();
                }
                return oHTTP;
            }

            function getHead(strURL, fncCallback, fncError) {
                var oHTTP = createRequest();
                if (oHTTP) {
                    if (fncCallback) {
                        if (typeof(oHTTP.onload) != "undefined") {
                            oHTTP.onload = function () {
                                if (oHTTP.status == "200") {
                                    fncCallback(this);
                                } else {
                                    if (fncError) fncError();
                                }
                                oHTTP = null;
                            };
                        } else {
                            oHTTP.onreadystatechange = function () {
                                if (oHTTP.readyState == 4) {
                                    if (oHTTP.status == "200") {
                                        fncCallback(this);
                                    } else {
                                        if (fncError) fncError();
                                    }
                                    oHTTP = null;
                                }
                            };
                        }
                    }
                    oHTTP.open("HEAD", strURL, true);
                    oHTTP.send(null);
                } else {
                    if (fncError) fncError();
                }
            }

            function sendRequest(strURL, fncCallback, fncError, aRange, bAcceptRanges, iFileSize) {
                var oHTTP = createRequest();
                if (oHTTP) {

                    var iDataOffset = 0;
                    if (aRange && !bAcceptRanges) {
                        iDataOffset = aRange[0];
                    }
                    var iDataLen = 0;
                    if (aRange) {
                        iDataLen = aRange[1] - aRange[0] + 1;
                    }

                    if (fncCallback) {
                        if (typeof(oHTTP.onload) != "undefined") {
                            oHTTP.onload = function () {
                                if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                                    oHTTP.binaryResponse = new BinaryFile(oHTTP.responseText, iDataOffset, iDataLen);
                                    oHTTP.fileSize = iFileSize || oHTTP.getResponseHeader("Content-Length");
                                    fncCallback(oHTTP);
                                } else {
                                    if (fncError) fncError();
                                }
                                oHTTP = null;
                            };
                        } else {
                            oHTTP.onreadystatechange = function () {
                                if (oHTTP.readyState == 4) {
                                    if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                                        // IE6 craps if we try to extend the XHR object
                                        var oRes = {
                                            status: oHTTP.status,
                                            // IE needs responseBody, Chrome/Safari needs responseText
                                            binaryResponse: new BinaryFile(
                                                typeof oHTTP.responseBody == "unknown" ? oHTTP.responseBody : oHTTP.responseText, iDataOffset, iDataLen
                                            ),
                                            fileSize: iFileSize || oHTTP.getResponseHeader("Content-Length")
                                        };
                                        fncCallback(oRes);
                                    } else {
                                        if (fncError) fncError();
                                    }
                                    oHTTP = null;
                                }
                            };
                        }
                    }
                    oHTTP.open("GET", strURL, true);

                    if (oHTTP.overrideMimeType) oHTTP.overrideMimeType('text/plain; charset=x-user-defined');

                    if (aRange && bAcceptRanges) {
                        oHTTP.setRequestHeader("Range", "bytes=" + aRange[0] + "-" + aRange[1]);
                    }

                    oHTTP.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");

                    oHTTP.send(null);
                } else {
                    if (fncError) fncError();
                }
            }

            return function (strURL, fncCallback, fncError, aRange) {

                if (aRange) {
                    getHead(
                        strURL,
                        function (oHTTP) {
                            var iLength = parseInt(oHTTP.getResponseHeader("Content-Length"), 10);
                            var strAcceptRanges = oHTTP.getResponseHeader("Accept-Ranges");

                            var iStart, iEnd;
                            iStart = aRange[0];
                            if (aRange[0] < 0)
                                iStart += iLength;
                            iEnd = iStart + aRange[1] - 1;

                            sendRequest(strURL, fncCallback, fncError, [iStart, iEnd], (strAcceptRanges == "bytes"), iLength);
                        }
                    );

                } else {
                    sendRequest(strURL, fncCallback, fncError);
                }
            }

        }());

        /*
         document.write(
         "<script type='text/vbscript'>\r\n"
         + "Function IEBinary_getByteAt(strBinary, iOffset)\r\n"
         + "	IEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\n"
         + "End Function\r\n"
         + "Function IEBinary_getLength(strBinary)\r\n"
         + "	IEBinary_getLength = LenB(strBinary)\r\n"
         + "End Function\r\n"
         + "</script>\r\n"
         );
         */

        document.write(
            "<script type='text/vbscript'>\r\n" + "Function IEBinary_getByteAt(strBinary, iOffset)\r\n" + "	IEBinary_getByteAt = AscB(MidB(strBinary, iOffset + 1, 1))\r\n" + "End Function\r\n" + "Function IEBinary_getBytesAt(strBinary, iOffset, iLength)\r\n" + "  Dim aBytes()\r\n" + "  ReDim aBytes(iLength - 1)\r\n" + "  For i = 0 To iLength - 1\r\n" + "   aBytes(i) = IEBinary_getByteAt(strBinary, iOffset + i)\r\n" + "  Next\r\n" + "  IEBinary_getBytesAt = aBytes\r\n" + "End Function\r\n" + "Function IEBinary_getLength(strBinary)\r\n" + "	IEBinary_getLength = LenB(strBinary)\r\n" + "End Function\r\n" + "</script>\r\n"
        );

    })();

    /*===================filePath:[src/resource/quark.base-1.0.0.js]======================*/
    (function () {

        /*
         Quark 1.0.0 (build 121)
         Licensed under the MIT License.
         http://github.com/quark-dev-team/quarkjs
         */


        (function (win) {

            /**
             * Quark?????????????????????
             * @name Quark
             * @class Quark???QuarkJS????????????????????????????????????????????????????????????????????????????????????Q???????????????????????????????????????????????????Q???
             */
            var Quark = win.Quark = win.Quark || {
                global: win
            };


            var emptyConstructor = function () {
            };
            /**
             * Quark????????????????????????
             * @param {Function} childClass ?????????
             * @param {Function} parentClass ?????????
             */
            Quark.inherit = function (childClass, parentClass) {
                emptyConstructor.prototype = parentClass.prototype;
                childClass.superClass = parentClass.prototype;
                childClass.prototype = new emptyConstructor();
                childClass.prototype.constructor = childClass;
                //Quark.merge(childClass.prototype, parentClass.prototype);
            };

            /**
             * ???props???????????????????????????????????????obj????????????
             * @param {Object} obj Object?????????
             * @param {Object} props ??????????????????obj???????????????????????????????????????
             * @param {Boolean} strict ????????????????????????????????????????????????false???
             * @return {Object} ????????????obj?????????
             */
            Quark.merge = function (obj, props, strict) {
                for (var key in props) {
                    if (!strict || obj.hasOwnProperty(key) || obj[key] !== undefined) obj[key] = props[key];
                }
                return obj;
            };

            /**
             * ??????func??????????????????scope??????this????????????
             * @param {Function} func ????????????????????????????????????
             * @param {Object} self ??????func????????????????????????
             * @return {Function} ????????????????????????self????????????func?????????????????????
             */
            Quark.delegate = function (func, self) {
                var context = self || win;
                if (arguments.length > 2) {
                    var args = Array.prototype.slice.call(arguments, 2);
                    return function () {
                        var newArgs = Array.prototype.concat.apply(args, arguments);
                        return func.apply(context, newArgs);
                    };
                } else {
                    return function () {
                        return func.apply(context, arguments);
                    };
                }
            };

            /**
             * ??????id??????DOM?????????
             * @param {String} id DOM?????????id???
             * @return {HTMLElement} DOM?????????
             */
            Quark.getDOM = function (id) {
                return document.getElementById(id);
            };

            /**
             * ????????????????????????type?????????props???DOM?????????
             * @param {String} type ??????DOM??????????????????canvas???div??????
             * @param {Object} props ???????????????DOM??????????????????
             * @return {HTMLElement} ????????????DOM?????????
             */
            Quark.createDOM = function (type, props) {
                var dom = document.createElement(type);
                for (var p in props) {
                    var val = props[p];
                    if (p == "style") {
                        for (var s in val) dom.style[s] = val[s];
                    } else {
                        dom[p] = val;
                    }
                }
                return dom;
            };

            /**
             * ????????????????????????????????????????????????global??????????????????Quark.use('Quark.test')???
             * @param {String} ???????????????????????????????????????Quark.test??????
             * @return {Object} ??????name??????????????????????????????
             */
            Quark.use = function (name) {
                var parts = name.split("."),
                    obj = win;
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i];
                    obj = obj[p] || (obj[p] = {});
                }
                return obj;
            };

            /**
             * ?????????????????????????????????????????????????????????
             */
            function detectBrowser(ns) {
                var ua = ns.ua = navigator.userAgent;
                ns.isWebKit = (/webkit/i).test(ua);
                ns.isMozilla = (/mozilla/i).test(ua);
                ns.isIE = (/msie/i).test(ua);
                ns.isFirefox = (/firefox/i).test(ua);
                ns.isChrome = (/chrome/i).test(ua);
                ns.isSafari = (/safari/i).test(ua) && !this.isChrome;
                ns.isMobile = (/mobile/i).test(ua);
                ns.isOpera = (/opera/i).test(ua);
                ns.isIOS = (/ios/i).test(ua);
                ns.isIpad = (/ipad/i).test(ua);
                ns.isIpod = (/ipod/i).test(ua);
                ns.isIphone = (/iphone/i).test(ua) && !this.isIpod;
                ns.isAndroid = (/android/i).test(ua);
                ns.supportStorage = "localStorage" in win;
                ns.supportOrientation = "orientation" in win;
                ns.supportDeviceMotion = "ondevicemotion" in win;
                ns.supportTouch = "ontouchstart" in win;
                ns.supportCanvas = document.createElement("canvas").getContext != null;
                ns.cssPrefix = ns.isWebKit ? "webkit" : ns.isFirefox ? "Moz" : ns.isOpera ? "O" : ns.isIE ? "ms" : "";
            };

            detectBrowser(Quark);

            /**
             * ????????????DOM????????????????????????????????????????????????:{left: leftValue, top: topValue}???
             * @param {HTMLElement} elem DOM?????????
             * @return {Object} ??????DOM?????????????????????????????????????????????:{left: leftValue, top: topValue}???
             */
            Quark.getElementOffset = function (elem) {
                var left = elem.offsetLeft,
                    top = elem.offsetTop;
                while ((elem = elem.offsetParent) && elem != document.body && elem != document) {
                    left += elem.offsetLeft;
                    top += elem.offsetTop;
                }
                return {
                    left: left,
                    top: top
                };
            };

            /**
             * ????????????????????????DOM????????????tagName??????canvas???div???
             * @param {Object} disObj ??????DisplayObject?????????????????????
             * @param {Object} imageObj ???????????????image?????????????????????????????????rect???
             * @return {HTMLElement} ????????????DOM?????????
             */
            Quark.createDOMDrawable = function (disObj, imageObj) {
                var tag = disObj.tagName || "div";
                var img = imageObj.image;
                var w = disObj.width || (img && img.width);
                var h = disObj.height || (img && img.height);

                var elem = Quark.createDOM(tag);
                if (disObj.id) elem.id = disObj.id;
                elem.style.position = "absolute";
                elem.style.left = (disObj.left || 0) + "px";
                elem.style.top = (disObj.top || 0) + "px";
                elem.style.width = w + "px";
                elem.style.height = h + "px";

                if (tag == "canvas") {
                    elem.width = w;
                    elem.height = h;
                    if (img) {
                        var ctx = elem.getContext("2d");
                        var rect = imageObj.rect || [0, 0, w, h];
                        ctx.drawImage(img, rect[0], rect[1], rect[2], rect[3], (disObj.x || 0), (disObj.y || 0), (disObj.width || rect[2]), (disObj.height || rect[3]));
                    }
                } else {
                    elem.style.opacity = disObj.alpha != undefined ? disObj.alpha : 1;
                    elem.style.overflow = "hidden";
                    if (img && img.src) {
                        elem.style.backgroundImage = "url(" + img.src + ")";
                        var bgX = disObj.rectX || 0,
                            bgY = disObj.rectY || 0;
                        elem.style.backgroundPosition = (-bgX) + "px " + (-bgY) + "px";
                    }
                }
                return elem;
            };

            /**
             * ????????????????????????
             */
            Quark.DEG_TO_RAD = Math.PI / 180;

            /**
             * ????????????????????????
             */
            Quark.RAD_TO_DEG = 180 / Math.PI;

            /**
             * ??????????????????obj????????????x???y??????????????????
             * @param {DisplayObject} obj ???????????????????????????
             * @param {Number} x ??????????????????x?????????
             * @param {Number} y ??????????????????y?????????
             * @param {Boolean} usePolyCollision ?????????????????????????????????????????????false???
             * @return {Number} ?????????x???y?????????obj??????1????????????-1???????????????0???
             */
            Quark.hitTestPoint = function (obj, x, y, usePolyCollision) {
                var b = obj.getBounds(),
                    len = b.length;
                var hit = x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;

                if (hit && usePolyCollision) {
                    var cross = 0,
                        onBorder = false,
                        minX, maxX, minY, maxY;
                    for (var i = 0; i < len; i++) {
                        var p1 = b[i],
                            p2 = b[(i + 1) % len];

                        if (p1.y == p2.y && y == p1.y) {
                            p1.x > p2.x ? (minX = p2.x, maxX = p1.x) : (minX = p1.x, maxX = p2.x);
                            if (x >= minX && x <= maxX) {
                                onBorder = true;
                                continue;
                            }
                        }

                        p1.y > p2.y ? (minY = p2.y, maxY = p1.y) : (minY = p1.y, maxY = p2.y);
                        if (y < minY || y > maxY) continue;

                        var nx = (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                        if (nx > x) cross++;
                        else if (nx == x) onBorder = true;
                    }

                    if (onBorder) return 0;
                    else if (cross % 2 == 1) return 1;
                    return -1;
                }
                return hit ? 1 : -1;
            };

            /**
             * ??????????????????obj1???obj2????????????????????????
             * @param {DisplayObject} obj1 ???????????????????????????
             * @param {DisplayObject} obj2 ???????????????????????????
             * @param {Boolean} usePolyCollision ?????????????????????????????????????????????false???
             * @return {Boolean} ???????????????true????????????false???
             */
            Quark.hitTestObject = function (obj1, obj2, usePolyCollision) {
                var b1 = obj1.getBounds(),
                    b2 = obj2.getBounds();
                var hit = b1.x <= b2.x + b2.width && b2.x <= b1.x + b1.width &&
                    b1.y <= b2.y + b2.height && b2.y <= b1.y + b1.height;

                if (hit && usePolyCollision) {
                    hit = Quark.polygonCollision(b2, b2);
                    return hit !== false;
                }
                return hit;
            };

            /**
             * ??????Separating Axis Theorem(SAT)?????????????????????????????????
             * @private
             * @param {Array} poly1 ?????????????????????????????????????????????[{x:0, y:0}, {x:10, y:0}, {x:10, y:10}, {x:0, y:10}]???
             * @param {Array} poly2 ????????????????????????????????????????????????poly1?????????
             * @param {Boolean} ???????????????true????????????false???
             */
            Quark.polygonCollision = function (poly1, poly2) {
                var result = doSATCheck(poly1, poly2, {
                    overlap: -Infinity,
                    normal: {
                        x: 0,
                        y: 0
                    }
                });
                if (result) return doSATCheck(poly2, poly1, result);
                return false;
            };

            function doSATCheck(poly1, poly2, result) {
                var len1 = poly1.length,
                    len2 = poly2.length,
                    currentPoint, nextPoint, distance, min1, max1, min2, max2, dot, overlap, normal = {
                        x: 0,
                        y: 0
                    };

                for (var i = 0; i < len1; i++) {
                    currentPoint = poly1[i];
                    nextPoint = poly1[(i < len1 - 1 ? i + 1 : 0)];

                    normal.x = currentPoint.y - nextPoint.y;
                    normal.y = nextPoint.x - currentPoint.x;

                    distance = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
                    normal.x /= distance;
                    normal.y /= distance;

                    min1 = max1 = poly1[0].x * normal.x + poly1[0].y * normal.y;
                    for (var j = 1; j < len1; j++) {
                        dot = poly1[j].x * normal.x + poly1[j].y * normal.y;
                        if (dot > max1) max1 = dot;
                        else if (dot < min1) min1 = dot;
                    }

                    min2 = max2 = poly2[0].x * normal.x + poly2[0].y * normal.y;
                    for (j = 1; j < len2; j++) {
                        dot = poly2[j].x * normal.x + poly2[j].y * normal.y;
                        if (dot > max2) max2 = dot;
                        else if (dot < min2) min2 = dot;
                    }

                    if (min1 < min2) {
                        overlap = min2 - max1;
                        normal.x = -normal.x;
                        normal.y = -normal.y;
                    } else {
                        overlap = min1 - max2;
                    }

                    if (overlap >= 0) {
                        return false;
                    } else if (overlap > result.overlap) {
                        result.overlap = overlap;
                        result.normal.x = normal.x;
                        result.normal.y = normal.y;
                    }
                }

                return result;
            };

            /**
             * ??????Quark???????????????????????????
             * @return {String} Quark???????????????????????????
             */
            Quark.toString = function () {
                return "Quark";
            };

            /**
             * ?????????log????????????console.log???????????????
             */
            Quark.trace = function () {
                var logs = Array.prototype.slice.call(arguments);
                if (typeof(console) != "undefined" && typeof(console.log) != "undefined") console.log(logs.join(" "));
            };

            /**
             * ???????????????namespace???Quark???Q??????Q?????????????????????????????????
             */
            if (win.Q == undefined) win.Q = Quark;
            if (win.trace == undefined) win.trace = Quark.trace;

        })(window);


        (function () {

            var Matrix = Quark.Matrix = function (a, b, c, d, tx, ty) {
                this.a = a;
                this.b = b;
                this.c = c;
                this.d = d;
                this.tx = tx;
                this.ty = ty;
            };

            Matrix.prototype.concat = function (mtx) {
                var a = this.a;
                var c = this.c;
                var tx = this.tx;

                this.a = a * mtx.a + this.b * mtx.c;
                this.b = a * mtx.b + this.b * mtx.d;
                this.c = c * mtx.a + this.d * mtx.c;
                this.d = c * mtx.b + this.d * mtx.d;
                this.tx = tx * mtx.a + this.ty * mtx.c + mtx.tx;
                this.ty = tx * mtx.b + this.ty * mtx.d + mtx.ty;
                return this;
            };

            Matrix.prototype.rotate = function (angle) {
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);

                var a = this.a;
                var c = this.c;
                var tx = this.tx;

                this.a = a * cos - this.b * sin;
                this.b = a * sin + this.b * cos;
                this.c = c * cos - this.d * sin;
                this.d = c * sin + this.d * cos;
                this.tx = tx * cos - this.ty * sin;
                this.ty = tx * sin + this.ty * cos;
                return this;
            };

            Matrix.prototype.scale = function (sx, sy) {
                this.a *= sx;
                this.d *= sy;
                this.tx *= sx;
                this.ty *= sy;
                return this;
            };

            Matrix.prototype.translate = function (dx, dy) {
                this.tx += dx;
                this.ty += dy;
                return this;
            };

            Matrix.prototype.identity = function () {
                this.a = this.d = 1;
                this.b = this.c = this.tx = this.ty = 0;
                return this;
            };

            Matrix.prototype.invert = function () {
                var a = this.a;
                var b = this.b;
                var c = this.c;
                var d = this.d;
                var tx = this.tx;
                var i = a * d - b * c;

                this.a = d / i;
                this.b = -b / i;
                this.c = -c / i;
                this.d = a / i;
                this.tx = (c * this.ty - d * tx) / i;
                this.ty = -(a * this.ty - b * tx) / i;
                return this;
            };

            Matrix.prototype.transformPoint = function (point, round, returnNew) {
                var x = point.x * this.a + point.y * this.c + this.tx;
                var y = point.x * this.b + point.y * this.d + this.ty;
                if (round) {
                    x = x + 0.5 >> 0;
                    y = y + 0.5 >> 0;
                }
                if (returnNew) return {
                    x: x,
                    y: y
                };
                point.x = x;
                point.y = y;
                return point;
            };

            Matrix.prototype.clone = function () {
                return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
            };

            Matrix.prototype.toString = function () {
                return "(a=" + this.a + ", b=" + this.b + ", c=" + this.c + ", d=" + this.d + ", tx=" + this.tx + ", ty=" + this.ty + ")";
            };

        })();


        (function () {

            var Rectangle = Quark.Rectangle = function (x, y, width, height) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
            };

            Rectangle.prototype.intersects = function (rect) {
                return (this.x <= rect.x + rect.width && rect.x <= this.x + this.width &&
                    this.y <= rect.y + rect.height && rect.y <= this.y + this.height);
            };

            Rectangle.prototype.intersection = function (rect) {
                var x0 = Math.max(this.x, rect.x);
                var x1 = Math.min(this.x + this.width, rect.x + rect.width);

                if (x0 <= x1) {
                    var y0 = Math.max(this.y, rect.y);
                    var y1 = Math.min(this.y + this.height, rect.y + rect.height);

                    if (y0 <= y1) {
                        return new Rectangle(x0, y0, x1 - x0, y1 - y0);
                    }
                }
                return null;
            };

            Rectangle.prototype.union = function (rect, returnNew) {
                var right = Math.max(this.x + this.width, rect.x + rect.width);
                var bottom = Math.max(this.y + this.height, rect.y + rect.height);

                var x = Math.min(this.x, rect.x);
                var y = Math.min(this.y, rect.y);
                var width = right - x;
                var height = bottom - y;
                if (returnNew) {
                    return new Rectangle(x, y, width, height);
                } else {
                    this.x = x;
                    this.y = y;
                    this.width = width;
                    this.height = height;
                }
            };

            Rectangle.prototype.containsPoint = function (x, y) {
                return (this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height);
            };

            Rectangle.prototype.clone = function () {
                return new Rectangle(this.x, this.y, this.width, this.height);
            };

            Rectangle.prototype.toString = function () {
                return "(x=" + this.x + ", y=" + this.y + ", width=" + this.width + ", height=" + this.height + ")";
            };

        })();


        (function () {

            /**
             * ??????Key???code????????????
             */
            Quark.KEY = {

                MOUSE_LEFT: 1,
                MOUSE_MID: 2,
                MOUSE_RIGHT: 3,

                BACKSPACE: 8,
                TAB: 9,
                NUM_CENTER: 12,
                ENTER: 13,
                RETURN: 13,
                SHIFT: 16,
                CTRL: 17,
                ALT: 18,
                PAUSE: 19,
                CAPS_LOCK: 20,
                ESC: 27,
                ESCAPE: 27,
                SPACE: 32,
                PAGE_UP: 33,
                PAGE_DOWN: 34,
                END: 35,
                HOME: 36,
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                PRINT_SCREEN: 44,
                INSERT: 45,
                DELETE: 46,

                ZERO: 48,
                ONE: 49,
                TWO: 50,
                THREE: 51,
                FOUR: 52,
                FIVE: 53,
                SIX: 54,
                SEVEN: 55,
                EIGHT: 56,
                NINE: 57,

                A: 65,
                B: 66,
                C: 67,
                D: 68,
                E: 69,
                F: 70,
                G: 71,
                H: 72,
                I: 73,
                J: 74,
                K: 75,
                L: 76,
                M: 77,
                N: 78,
                O: 79,
                P: 80,
                Q: 81,
                R: 82,
                S: 83,
                T: 84,
                U: 85,
                V: 86,
                W: 87,
                X: 88,
                Y: 89,
                Z: 90,

                CONTEXT_MENU: 93,
                NUM_ZERO: 96,
                NUM_ONE: 97,
                NUM_TWO: 98,
                NUM_THREE: 99,
                NUM_FOUR: 100,
                NUM_FIVE: 101,
                NUM_SIX: 102,
                NUM_SEVEN: 103,
                NUM_EIGHT: 104,
                NUM_NINE: 105,
                NUM_MULTIPLY: 106,
                NUM_PLUS: 107,
                NUM_MINUS: 109,
                NUM_PERIOD: 110,
                NUM_DIVISION: 111,
                F1: 112,
                F2: 113,
                F3: 114,
                F4: 115,
                F5: 116,
                F6: 117,
                F7: 118,
                F8: 119,
                F9: 120,
                F10: 121,
                F11: 122,
                F12: 123
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name EventManager
             * @class EventManager??????????????????????????????????????????
             */
            var EventManager = Quark.EventManager = function () {
                this.keyState = {};
                this._evtHandlers = {};
            };

            /**
             * ??????Quark.Stage?????????????????????Stage???????????????????????????????????????
             * @param stage Quark.Stage???????????????
             * @param events ?????????????????????????????????
             */
            EventManager.prototype.registerStage = function (stage, events, preventDefault, stopPropagation) {
                this.register(stage.context.canvas, events, {
                    host: stage,
                    func: stage.dispatchEvent
                }, preventDefault, stopPropagation);
            };

            /**
             * ??????Quark.Stage???????????????
             * @param stage Quark.Stage???????????????
             * @param events ?????????????????????????????????
             */
            EventManager.prototype.unregisterStage = function (stage, events) {
                this.unregister(stage.context.canvas, events, stage.dispatchEvent);
            };

            /**
             * ??????DOM???????????????????????????????????????callback?????????
             * @param target ????????????DOM?????????
             * @param events ??????????????????????????????
             */
            EventManager.prototype.register = function (target, events, callback, preventDefault, stopPropagation) {
                if (callback == null || (typeof callback == "function")) callback = {
                    host: null,
                    func: callback
                };
                var params = {
                    prevent: preventDefault,
                    stop: stopPropagation
                };

                var me = this,
                    handler = function (e) {
                        me._onEvent(e, params, callback);
                    };

                for (var i = 0; i < events.length; i++) {
                    var type = events[i],
                        list = this._evtHandlers[type] || (this._evtHandlers[type] = []);
                    for (var j = 0, has = false; j < list.length; j++) {
                        var li = list[j];
                        if (li.target == target && li.callback.func == callback.func) {
                            trace("duplicate callback");
                            has = true;
                            break;
                        }
                    }
                    if (!has) {
                        list.push({
                            target: target,
                            callback: callback,
                            handler: handler
                        });
                        target.addEventListener(type, handler, false);
                    }
                }
            };

            /**
             * ???????????????????????????
             * @param target ????????????DOM?????????
             * @param events ?????????????????????????????????
             */
            EventManager.prototype.unregister = function (target, events, callback) {
                for (var i = 0; i < events.length; i++) {
                    var type = events[i],
                        list = this._evtHandlers[type];
                    for (var j = 0; j < list.length; j++) {
                        var li = list[j];
                        if (li.target == target && (li.callback.func == callback || callback == null)) {
                            target.removeEventListener(type, li.handler);
                            list.splice(j, 1);
                            break;
                        }
                    }
                }
            };

            /**
             * ????????????????????????
             * @private
             */
            EventManager.prototype._onEvent = function (e, params, callback) {
                //correct touch events
                var ne = e,
                    type = e.type,
                    isTouch = e.type.indexOf("touch") == 0;
                if (isTouch) {
                    ne = (e.touches && e.touches.length > 0) ? e.touches[0] :
                        (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e;
                    ne.type = type;
                    ne.rawEvent = e;
                }

                if (type == "keydown" || type == "keyup" || type == "keypress") {
                    this.keyState[e.keyCode] = type;
                }

                //e.eventTime = Date.now();

                if (callback.func != null) callback.func.call(callback.host, ne);

                EventManager.stop(e, !params.prevent, !params.stop);
            };

            /**
             * ???????????????
             * @param e ???????????????????????????
             * @param continueDefault ????????????????????????????????????
             * @param continuePropagation ??????????????????????????????
             */
            EventManager.stop = function (e, continueDefault, continuePropagation) {
                if (!continueDefault) e.preventDefault();
                if (!continuePropagation) {
                    e.stopPropagation();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                }
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name EventDispatcher
             * @class EventDispatcher?????????????????????????????????????????????????????????????????????????????????????????????????????????
             */
            var EventDispatcher = Quark.EventDispatcher = function () {
                //??????????????????????????????{type1:[listener1, listener2], type2:[listener3, listener4]}
                this._eventMap = {};
            };

            /**
             * ????????????????????????????????????????????????????????????????????????
             */
            EventDispatcher.prototype.addEventListener = function (type, listener) {
                var map = this._eventMap[type];
                if (map == null) map = this._eventMap[type] = [];

                if (map.indexOf(listener) == -1) {
                    map.push(listener);
                    return true;
                }
                return false;
            };

            /**
             * ????????????????????????
             */
            EventDispatcher.prototype.removeEventListener = function (type, listener) {
                if (arguments.length == 1) return this.removeEventListenerByType(type);

                var map = this._eventMap[type];
                if (map == null) return false;

                for (var i = 0; i < map.length; i++) {
                    var li = map[i];
                    if (li === listener) {
                        map.splice(i, 1);
                        if (map.length == 0) delete this._eventMap[type];
                        return true;
                    }
                }
                return false;
            };

            /**
             * ?????????????????????????????????????????????
             */
            EventDispatcher.prototype.removeEventListenerByType = function (type) {
                var map = this._eventMap[type];
                if (map != null) {
                    delete this._eventMap[type];
                    return true;
                }
                return false;
            };

            /**
             * ??????????????????????????????
             */
            EventDispatcher.prototype.removeAllEventListeners = function () {
                this._eventMap = {};
            };

            /**
             * ???????????????????????????????????????
             */
            EventDispatcher.prototype.dispatchEvent = function (event) {
                var map = this._eventMap[event.type];
                if (map == null) return false;
                if (!event.target) event.target = this;
                map = map.slice();

                for (var i = 0; i < map.length; i++) {
                    var listener = map[i];
                    if (typeof(listener) == "function") {
                        listener.call(this, event);
                    }
                }
                return true;
            };

            /**
             * ????????????????????????????????????????????????????????????
             */
            EventDispatcher.prototype.hasEventListener = function (type) {
                var map = this._eventMap[type];
                return map != null && map.length > 0;
            };

            //??????????????????????????????????????????
            EventDispatcher.prototype.on = EventDispatcher.prototype.addEventListener;
            EventDispatcher.prototype.un = EventDispatcher.prototype.removeEventListener;
            EventDispatcher.prototype.fire = EventDispatcher.prototype.dispatchEvent;

        })();


        (function () {

            /**
             * ????????????.
             * @name Context
             * @class Context???Quark???????????????????????????????????????????????????????????????????????????????????????????????????
             * @param {Object} props ????????????????????????????????????
             * <p>canvas - ????????????????????????????????????</p>
             */
            var Context = Quark.Context = function (props) {
                if (props.canvas == null) throw "Quark.Context Error: canvas is required.";

                this.canvas = null;
                Quark.merge(this, props);
            };

            /**
             * ???????????????????????????????????????????????????????????????
             */
            Context.prototype.startDraw = function () {
            };

            /**
             * ?????????????????????????????????????????????
             */
            Context.prototype.draw = function () {
            };

            /**
             * ?????????????????????????????????????????????????????????????????????
             */
            Context.prototype.endDraw = function () {
            };

            /**
             * ??????????????????????????????????????????????????????
             */
            Context.prototype.transform = function () {
            };

            /**
             * ?????????????????????????????????????????????????????????
             * @param {DisplayObject} target ???????????????????????????
             */
            Context.prototype.remove = function (target) {
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name CanvasContext
             * @augments Context
             * @class CanvasContext???Canvas???????????????????????????????????????????????????Canvas??????
             * @param {Object} props ????????????????????????????????????
             * <p>canvas - ???????????????????????????canvas???HTMLCanvasElement?????????</p>
             */
            var CanvasContext = Quark.CanvasContext = function (props) {
                CanvasContext.superClass.constructor.call(this, props);
                this.context = this.canvas.getContext("2d");
            };
            Quark.inherit(CanvasContext, Quark.Context);

            /**
             * ???????????????????????????????????????
             */
            CanvasContext.prototype.startDraw = function () {
                this.context.save();
            };

            /**
             * ??????????????????????????????Canvas??????
             * @param {DisplayObject} target ???????????????????????????
             */
            CanvasContext.prototype.draw = function (target) {
                //ignore children drawing if the parent has a mask.
                if (target.parent != null && target.parent.mask != null) return;

                if (target.mask != null) {
                    //we implements the mask function by using 'source-in' composite operation.
                    //so can't draw objects with masks into this canvas directly.
                    var w = target.width,
                        h = target.height;
                    var context = Q._helpContext,
                        canvas = context.canvas,
                        ctx = context.context;
                    canvas.width = 0;
                    canvas.width = w;
                    canvas.height = h;
                    context.startDraw();
                    target.mask._render(context);
                    ctx.globalCompositeOperation = 'source-in';

                    //this is a trick for ignoring mask drawing during object drawing.
                    var mask = target.mask;
                    target.mask = null;
                    if (target instanceof Quark.DisplayObjectContainer) {
                        //container's children should draw at once in 'source-in' mode.
                        var cache = target._cache || Quark.cacheObject(target);
                        ctx.drawImage(cache, 0, 0, w, h, 0, 0, w, h);
                    } else {
                        target.render(context);
                    }
                    context.endDraw();
                    target.mask = mask;

                    arguments[0] = canvas;
                    this.context.drawImage.apply(this.context, arguments);
                } else if (target._cache != null) {
                    //draw cache if exist
                    this.context.drawImage(target._cache, 0, 0);
                } else if (target instanceof Quark.Graphics || target instanceof Quark.Text) {
                    //special drawing
                    target._draw(this.context);
                } else {
                    //normal draw
                    var img = target.getDrawable(this);
                    if (img != null) {
                        arguments[0] = img;
                        this.context.drawImage.apply(this.context, arguments);
                    }
                }
            };

            /**
             * ?????????????????????????????????
             */
            CanvasContext.prototype.endDraw = function () {
                this.context.restore();
            };

            /**
             * ??????????????????????????????context????????????????????????
             * @param {DisplayObject} target ????????????????????????????????????????????????
             */
            CanvasContext.prototype.transform = function (target) {
                var ctx = this.context;

                if (target instanceof Q.Stage) {
                    //Use style for stage scaling
                    if (target._scaleX != target.scaleX) {
                        target._scaleX = target.scaleX;
                        this.canvas.style.width = target._scaleX * target.width + "px";
                    }
                    if (target._scaleY != target.scaleY) {
                        target._scaleY = target.scaleY;
                        this.canvas.style.height = target._scaleY * target.height + "px";
                    }
                } else {
                    if (target.x != 0 || target.y != 0) ctx.translate(target.x, target.y);
                    if (target.rotation % 360 != 0) ctx.rotate(target.rotation % 360 * Quark.DEG_TO_RAD);
                    if (target.scaleX != 1 || target.scaleY != 1) ctx.scale(target.scaleX, target.scaleY);
                    if (target.regX != 0 || target.regY != 0) ctx.translate(-target.regX, -target.regY);
                }

                if (target.alpha > 0) ctx.globalAlpha *= target.alpha;
            };

            /**
             * ???????????????????????????????????????
             * @param {Number} x ???????????????x????????????
             * @param {Number} y ???????????????y????????????
             * @param {Number} width ????????????????????????
             * @param {Number} height ????????????????????????
             */
            CanvasContext.prototype.clear = function (x, y, width, height) {
                this.context.clearRect(x, y, width, height);
                //this.canvas.width = this.canvas.width;
            };

        })();


        (function () {

            /**
             * ???????????????????????????transform???transform3D???
             */
            var testElem = document.createElement("div");
            var supportTransform = testElem.style[Quark.cssPrefix + "Transform"] != undefined;
            var supportTransform3D = testElem.style[Quark.cssPrefix + "Perspective"] != undefined;
            var docElem = document.documentElement;
            if (supportTransform3D && 'webkitPerspective' in docElem.style) {
                testElem.id = 'test3d';
                var st = document.createElement('style');
                st.textContent = '@media (-webkit-transform-3d){#test3d{height:3px}}';
                document.head.appendChild(st);
                docElem.appendChild(testElem);

                supportTransform3D = testElem.offsetHeight === 3;

                st.parentNode.removeChild(st);
                testElem.parentNode.removeChild(testElem);
            }
            ;
            Quark.supportTransform = supportTransform;
            Quark.supportTransform3D = supportTransform3D;
            if (!supportTransform) {
                trace("Warn: DOMContext requires css transfrom support.");
                return;
            }

            /**
             * ????????????.
             * @name DOMContext
             * @augments Context
             * @class DOMContext???DOM????????????????????????????????????dom???????????????????????????
             * @param {Object} props ????????????????????????????????????
             * <p>canvas - ????????????????????????????????????HTMLDivElement?????????</p>
             */
            var DOMContext = Quark.DOMContext = function (props) {
                DOMContext.superClass.constructor.call(this, props);
            };
            Quark.inherit(DOMContext, Quark.Context);

            /**
             * ?????????????????????DOM???????????????
             * @param {DisplayObject} target ???????????????????????????
             */
            DOMContext.prototype.draw = function (target) {
                if (!target._addedToDOM) {
                    var parent = target.parent;
                    var targetDOM = target.getDrawable(this);
                    if (parent != null) {
                        var parentDOM = parent.getDrawable(this);
                        if (targetDOM.parentNode != parentDOM) parentDOM.appendChild(targetDOM);
                        if (parentDOM.parentNode == null && parent instanceof Quark.Stage) {
                            this.canvas.appendChild(parentDOM);
                            parent._addedToDOM = true;
                        }
                        target._addedToDOM = true;
                    }
                }
            };

            /**
             * ???????????????????????????DOM??????css????????????????????????
             * @param {DisplayObject} target ????????????????????????????????????????????????
             */
            DOMContext.prototype.transform = function (target) {
                var image = target.getDrawable(this);
                //?????????????????????????????????DOM?????????????????????????????????????????????transformEnabled=false???
                if (!target.transformEnabled && target._addedToDOM) return;

                var prefix = Quark.cssPrefix,
                    origin = prefix + "TransformOrigin",
                    transform = prefix + "Transform",
                    style = image.style;

                if (!style.display || target.propChanged("visible", "alpha")) {
                    style.display = (!target.visible || target.alpha <= 0) ? "none" : "";
                }
                if (!style.opacity || target.propChanged("alpha")) {
                    style.opacity = target.alpha;
                }
                if (!style.backgroundPosition || target.propChanged("rectX", "rectY")) {
                    style.backgroundPosition = (-target.rectX) + "px " + (-target.rectY) + "px";
                }
                if (!style.width || target.propChanged("width", "height")) {
                    style.width = target.width + "px";
                    style.height = target.height + "px";
                }
                if (!style[origin] || target.propChanged("regX", "regY")) {
                    style[origin] = target.regX + "px " + target.regY + "px";
                }
                if (!style[transform] || target.propChanged("x", "y", "regX", "regY", "scaleX", "scaleY", "rotation")) {
                    var css = Quark.supportTransform3D ? getTransformCSS(target, true) : getTransformCSS(target, false);
                    style[transform] = css;
                }
                if (!style.zIndex || target.propChanged("_depth")) {
                    style.zIndex = target._depth;
                }
                if (target.mask != null) {
                    style[Q.cssPrefix + "MaskImage"] = target.mask.getDrawable(this).style.backgroundImage;
                    style[Q.cssPrefix + "MaskRepeat"] = "no-repeat";
                    style[Q.cssPrefix + "MaskPosition"] = target.mask.x + "px " + target.mask.y + "px";
                }
                style.pointerEvents = target.eventEnabled ? "auto" : "none";
            };

            /**
             * ????????????????????????css??????????????????
             * @param {DisplayObject} target ???????????????
             * @param {Boolean} useTransform3D ????????????transform???3d??????????????????transform???3d???????????????????????????????????????false???
             * @return {String} ?????????css?????????
             */
            function getTransformCSS(target, useTransform3D) {
                var css = "";

                if (useTransform3D) {
                    css += "translate3d(" + (target.x - target.regX) + "px, " + (target.y - target.regY) + "px, 0px)" + "rotate3d(0, 0, 1, " + target.rotation + "deg)" + "scale3d(" + target.scaleX + ", " + target.scaleY + ", 1)";
                } else {
                    css += "translate(" + (target.x - target.regX) + "px, " + (target.y - target.regY) + "px)" + "rotate(" + target.rotation + "deg)" + "scale(" + target.scaleX + ", " + target.scaleY + ")";
                }
                return css;
            };

            /**
             * ???????????????????????????dom??????????????????????????????visible=0???alpha=0????????????????????????????????????????????????
             * @param {DisplayObject} target ???????????????????????????
             */
            DOMContext.prototype.hide = function (target) {
                target.getDrawable(this).style.display = "none";
            };

            /**
             * ?????????????????????????????????dom?????????????????????????????????????????????
             * @param {DisplayObject} target ???????????????????????????
             */
            DOMContext.prototype.remove = function (target) {
                var targetDOM = target.getDrawable(this);
                var parentNode = targetDOM.parentNode;
                if (parentNode != null) parentNode.removeChild(targetDOM);
                target._addedToDOM = false;
            };

        })();


        (function () {

            /**
             * UIDUtil?????????????????????????????????ID???
             * @private
             */
            var UIDUtil = Quark.UIDUtil = {
                _counter: 0
            };

            /**
             * ?????????????????????????????????????????????ID??????Stage1???Bitmap2??????
             */
            UIDUtil.createUID = function (name) {
                var charCode = name.charCodeAt(name.length - 1);
                if (charCode >= 48 && charCode <= 57) name += "_";
                return name + this._counter++;
            };

            /**
             * ????????????displayObject??????????????????????????????????????????????????????????????????Stage1.Container2.Bitmap3???
             */
            UIDUtil.displayObjectToString = function (displayObject) {
                var result;
                for (var o = displayObject; o != null; o = o.parent) {
                    var s = o.id != null ? o.id : o.name;
                    result = result == null ? s : (s + "." + result);
                    if (o == o.parent) break;
                }
                return result;
            };

        })();


        (function () {

            /**
             * ??????URL?????????
             * @return {Object} ??????URL???????????????????????????
             */
            Quark.getUrlParams = function () {
                var params = {};
                var url = window.location.href;
                var idx = url.indexOf("?");
                if (idx > 0) {
                    var queryStr = url.substring(idx + 1);
                    var args = queryStr.split("&");
                    for (var i = 0, a, nv; a = args[i]; i++) {
                        nv = args[i] = a.split("=");
                        params[nv[0]] = nv.length > 1 ? nv[1] : true;
                    }
                }
                return params;
            };

            var head = document.getElementsByTagName("head")[0];
            var metas = head.getElementsByTagName("meta");
            var metaAfterNode = metas.length > 0 ? metas[metas.length - 1].nextSibling : head.childNodes[0];

            /**
             * ????????????meta???head??????
             * @param {Object} props ????????????meta?????????. ????????????{name:'viewport', content:'width=device-width'}???
             */
            Quark.addMeta = function (props) {
                var meta = document.createElement("meta");
                for (var p in props) meta.setAttribute(p, props[p]);
                head.insertBefore(meta, metaAfterNode);
            };

            /**
             * ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????
             * @param {Stage} stage ???????????????????????????
             */
            Quark.toggleDebugRect = function (stage) {
                stage.debug = !stage.debug;
                if (stage.debug) {
                    stage._render = function (context) {
                        if (context.clear != null) context.clear(0, 0, stage.width, stage.height);
                        Quark.Stage.superClass._render.call(stage, context);

                        var ctx = stage.context.context;
                        if (ctx != null) {
                            ctx.save();
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = "#f00";
                            ctx.globalAlpha = 0.5;
                        }
                        drawObjectRect(stage, ctx);
                        if (ctx != null) ctx.restore();
                    };
                } else {
                    stage._render = function (context) {
                        if (context.clear != null) context.clear(0, 0, stage.width, stage.height);
                        Quark.Stage.superClass._render.call(stage, context);
                    };
                }
            };

            /**
             * ???????????????????????????????????????
             * @private
             */
            function drawObjectRect(obj, ctx) {
                for (var i = 0; i < obj.children.length; i++) {
                    var child = obj.children[i];
                    if (child.children) {
                        drawObjectRect(child, ctx);
                    } else {
                        if (ctx != null) {
                            var b = child.getBounds();

                            ctx.globalAlpha = 0.2;
                            ctx.beginPath();
                            var p0 = b[0];
                            ctx.moveTo(p0.x - 0.5, p0.y - 0.5);
                            for (var j = 1; j < b.length; j++) {
                                var p = b[j];
                                ctx.lineTo(p.x - 0.5, p.y - 0.5);
                            }
                            ctx.lineTo(p0.x - 0.5, p0.y - 0.5);
                            ctx.stroke();
                            ctx.closePath();
                            ctx.globalAlpha = 0.5;

                            ctx.beginPath();
                            ctx.rect((b.x >> 0) - 0.5, (b.y >> 0) - 0.5, b.width >> 0, b.height >> 0);
                            ctx.stroke();
                            ctx.closePath();
                        } else {
                            if (child.drawable.domDrawable) child.drawable.domDrawable.style.border = "1px solid #f00";
                        }
                    }
                }
            };

            /**
             * ???DisplayObject??????????????????????????????????????????????????????????????????????????????dataURL??????????????????
             * @param {DisplayObject} obj ???????????????????????????
             * @param {Boolean} toImage ???????????????????????????DataURL?????????????????????false???
             * @param {String} type ???????????????DataURL???????????????mime??????????????????"image/png"???
             * @return {Object} ??????????????????????????????????????????toImage???????????????Canvas???Image?????????
             */
            Quark.cacheObject = function (obj, toImage, type) {
                var w = obj.width,
                    h = obj.height,
                    mask = obj.mask;
                var canvas = Quark.createDOM("canvas", {
                    width: w,
                    height: h
                });
                var context = new Quark.CanvasContext({
                    canvas: canvas
                });
                obj.mask = null;
                obj.render(context);
                obj.mask = mask;

                if (toImage) {
                    var img = new Image();
                    img.width = w;
                    img.height = h;
                    img.src = canvas.toDataURL(type || "image/png");
                    return img;
                }
                return canvas;
            };


            /**
             * ??????Quark?????????????????????????????????
             * @private
             */
            Quark._helpContext = new Quark.CanvasContext({
                canvas: Quark.createDOM("canvas")
            });

        })();


        (function () {

            /**
             * ????????????.
             * @name Timer
             * @class Timer??????????????????????????????????????????????????????????????????
             * @param interval ????????????????????????????????????????????????
             */
            var Timer = Quark.Timer = function (interval) {
                this.interval = interval || 50;
                this.paused = false;
                this.info = {
                    lastTime: 0,
                    currentTime: 0,
                    deltaTime: 0,
                    realDeltaTime: 0
                };

                this._startTime = 0;
                this._intervalID = null;
                this._listeners = [];
            };

            /**
             * ??????????????????
             */
            Timer.prototype.start = function () {
                if (this._intervalID != null) return;
                this._startTime = this.info.lastTime = this.info.currentTime = Date.now();
                var me = this;
                var run = function () {
                    me._intervalID = setTimeout(run, me.interval);
                    me._run();
                };
                run();
            };

            /**
             * ??????????????????
             */
            Timer.prototype.stop = function () {
                clearTimeout(this._intervalID);
                this._intervalID = null;
                this._startTime = 0;
            };

            /**
             * ??????????????????
             */
            Timer.prototype.pause = function () {
                this.paused = true;
            };

            /**
             * ??????????????????
             */
            Timer.prototype.resume = function () {
                this.paused = false;
            };

            /**
             * ??????????????????????????????????????????????????????????????????????????????step?????????
             * @private
             */
            Timer.prototype._run = function () {
                if (this.paused) return;

                var info = this.info;
                var time = info.currentTime = Date.now();
                info.deltaTime = info.realDeltaTime = time - info.lastTime;

                for (var i = 0, len = this._listeners.length, obj, runTime; i < len; i++) {
                    obj = this._listeners[i];
                    runTime = obj.__runTime || 0;
                    if (runTime == 0) {
                        obj.step(this.info);
                    } else if (time > runTime) {
                        obj.step(this.info);
                        this._listeners.splice(i, 1);
                        i--;
                        len--;
                    }
                }

                info.lastTime = time;
            };

            /**
             * ??????????????????time??????callback?????????
             * @param callback ??????????????????
             * @param time ???????????????????????????????????????
             */
            Timer.prototype.delay = function (callback, time) {
                var obj = {
                    step: callback,
                    __runTime: Date.now() + time
                };
                this.addListener(obj);
            };

            /**
             * ????????????????????????????????????????????????????????????????????????????????????step????????????listner?????????step?????????
             * @param obj ??????????????????
             **/
            Timer.prototype.addListener = function (obj) {
                if (obj == null || typeof(obj.step) != "function") throw "Timer Error: The listener object must implement a step() method!";
                this._listeners.push(obj);
            };

            /**
             * ??????????????????
             */
            Timer.prototype.removeListener = function (obj) {
                var index = this._listeners.indexOf(obj);
                if (index > -1) {
                    this._listeners.splice(index, 1);
                }
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name ImageLoader
             * @augments EventDispatcher
             * @class ImageLoader???????????????????????????????????????????????????????????????
             * @param source ?????????????????????????????????????????????????????????????????????????????????????????????????????????{src:$url, id:$id, size:$size}???
             */
            var ImageLoader = Quark.ImageLoader = function (source) {
                ImageLoader.superClass.constructor.call(this);

                this.loading = false; //ready-only

                this._index = -1;
                this._loaded = 0;
                this._images = {};
                this._totalSize = 0;
                this._loadHandler = Quark.delegate(this._loadHandler, this);

                this._addSource(source);
            };
            Quark.inherit(ImageLoader, Quark.EventDispatcher);

            /**
             * ?????????????????????????????????
             * @param source ?????????????????????????????????????????????????????????????????????????????????
             */
            ImageLoader.prototype.load = function (source) {
                this._addSource(source);
                if (!this.loading) this._loadNext();
            };

            /**
             * ?????????????????????
             * @private
             */
            ImageLoader.prototype._addSource = function (source) {
                if (!source) return;
                source = (source instanceof Array) ? source : [source];
                for (var i = 0; i < source.length; i++) {
                    this._totalSize += source[i].size || 0;
                }
                if (!this._source) this._source = source;
                else this._source = this._source.concat(source);
            };

            /**
             * ??????????????????????????????
             * @private
             */
            ImageLoader.prototype._loadNext = function () {
                this._index++;
                if (this._index >= this._source.length) {
                    this.dispatchEvent({
                        type: "complete",
                        target: this,
                        images: this._images
                    });
                    this._source = [];
                    this.loading = false;
                    this._index = -1;
                    return;
                }

                var img = new Image();
                img.onload = this._loadHandler;
                img.src = this._source[this._index].src;
                this.loading = true;
            };

            /**
             * ????????????????????????
             * @private
             */
            ImageLoader.prototype._loadHandler = function (e) {
                this._loaded++;
                var image = this._source[this._index];
                image.image = e.target;
                var id = image.id || image.src;
                this._images[id] = image;
                this.dispatchEvent({
                    type: "loaded",
                    target: this,
                    image: image
                });
                this._loadNext();
            };

            /**
             * ???????????????????????????????????????
             */
            ImageLoader.prototype.getLoaded = function () {
                return this._loaded;
            };

            /**
             * ????????????????????????????????????
             */
            ImageLoader.prototype.getTotal = function () {
                return this._source.length;
            };

            /**
             * ????????????????????????????????????????????????????????????????????????size???????????????????????????
             */
            ImageLoader.prototype.getLoadedSize = function () {
                var size = 0;
                for (var id in this._images) {
                    var item = this._images[id];
                    size += item.size || 0;
                }
                return size;
            };

            /**
             * ??????????????????????????????????????????????????????????????????size???????????????????????????
             */
            ImageLoader.prototype.getTotalSize = function () {
                return this._totalSize;
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name Tween
             * @class Tween????????????????????????????????????????????????????????????????????????????????????????????????
             * @param target ????????????????????????????????????
             * @param newProps ????????????????????????????????????
             * @param params ?????????????????????????????????
             */
            var Tween = Quark.Tween = function (target, newProps, params) {
                this.target = target;
                this.time = 0;
                this.delay = 0;
                this.paused = false;
                this.loop = false;
                this.reverse = false;
                this.interval = 0;
                this.ease = Easing.Linear.EaseNone;
                this.next = null;

                this.onStart = null;
                this.onUpdate = null;
                this.onComplete = null;

                this._oldProps = {};
                this._newProps = {};
                this._deltaProps = {};
                this._startTime = 0;
                this._lastTime = 0;
                this._pausedTime = 0;
                this._pausedStartTime = 0;
                this._reverseFlag = 1;
                this._frameTotal = 0;
                this._frameCount = 0;

                for (var p in newProps) {
                    var oldVal = target[p],
                        newVal = newProps[p];
                    if (oldVal !== undefined) {
                        if (typeof(oldVal) == "number" && typeof(newVal) == "number") {
                            this._oldProps[p] = oldVal;
                            this._newProps[p] = newVal;
                            this._deltaProps[p] = newVal - oldVal;
                        }
                    }
                }

                for (var p in params) {
                    this[p] = params[p];
                }
            };

            /**
             * ?????????????????????????????????????????????
             * @param oldProps ??????????????????????????????
             * @param newProps ??????????????????????????????
             */
            Tween.prototype.setProps = function (oldProps, newProps) {
                for (var p in oldProps) {
                    this.target[p] = this._oldProps[p] = oldProps[p];
                }
                for (var p in newProps) {
                    this._newProps[p] = newProps[p];
                    this._deltaProps[p] = newProps[p] - this.target[p];
                }
            };

            /**
             * ?????????Tween??????
             * @private
             */
            Tween.prototype._init = function () {
                this._startTime = Date.now() + this.delay;
                this._pausedTime = 0;
                if (this.interval > 0) this._frameTotal = Math.round(this.time / this.interval);
                Tween.add(this);
            };

            /**
             * ??????????????????????????????
             */
            Tween.prototype.start = function () {
                this._init();
                this.paused = false;
            };

            /**
             * ??????????????????????????????
             */
            Tween.prototype.stop = function () {
                Tween.remove(this);
            };

            /**
             * ??????????????????????????????
             */
            Tween.prototype.pause = function () {
                this.paused = true;
                this._pausedStartTime = Date.now();
            };

            /**
             * ??????????????????????????????
             */
            Tween.prototype.resume = function () {
                this.paused = false;
                this._pausedTime += Date.now() - this._pausedStartTime;
            };

            /**
             * Tween???????????????????????????
             * @private
             */
            Tween.prototype._update = function () {
                if (this.paused) return;
                var now = Date.now();
                var elapsed = now - this._startTime - this._pausedTime;
                if (elapsed < 0) return;

                if (this._lastTime == 0 && this.onStart != null) this.onStart(this);
                this._lastTime = now;

                var ratio = this._frameTotal > 0 ? (++this._frameCount / this._frameTotal) : (elapsed / this.time);
                if (ratio > 1) ratio = 1;
                var value = this.ease(ratio);

                for (var p in this._oldProps) {
                    this.target[p] = this._oldProps[p] + this._deltaProps[p] * this._reverseFlag * value;
                }

                if (this.onUpdate != null) this.onUpdate(this, value);

                if (ratio >= 1) {
                    if (this.reverse) {
                        var tmp = this._oldProps;
                        this._oldProps = this._newProps;
                        this._newProps = tmp;
                        this._startTime = Date.now();
                        this._frameCount = 0;
                        this._reverseFlag *= -1;
                        if (!this.loop) this.reverse = false;
                    } else if (this.loop) {
                        for (var p in this._oldProps) this.target[p] = this._oldProps[p];
                        this._startTime = Date.now();
                        this._frameCount = 0;
                    } else {
                        Tween.remove(this);
                        var next = this.next,
                            nextTween;
                        if (next != null) {
                            if (next instanceof Tween) {
                                nextTween = next;
                                next = null;
                            } else {
                                nextTween = next.shift();
                            }
                            if (nextTween != null) {
                                nextTween.next = next;
                                nextTween.start();
                            }
                        }
                    }
                    if (this.onComplete != null) this.onComplete(this);
                }
            };

            /**
             * ????????????Tween???????????????
             * @static
             */
            Tween._tweens = [];

            /**
             * ????????????Tween??????????????????Quark.Timer??????????????????
             * @static
             */
            Tween.step = function () {
                var tweens = this._tweens,
                    i = tweens.length;
                while (--i >= 0) tweens[i]._update();
            };

            /**
             * ??????Tween?????????
             * @static
             */
            Tween.add = function (tween) {
                if (this._tweens.indexOf(tween) == -1) this._tweens.push(tween);
                return this;
            };

            /**
             * ??????Tween?????????
             * @staitc
             */
            Tween.remove = function (tween) {
                var tweens = this._tweens,
                    index = tweens.indexOf(tween);
                if (index > -1) tweens.splice(index, 1);
                return this;
            };

            /**
             * ?????????????????????????????????????????????????????????????????????????????????
             * @param target ??????????????????
             * @param toProps ????????????????????????????????????
             * @param params ????????????????????????
             */
            Tween.to = function (target, toProps, params) {
                var tween = new Tween(target, toProps, params);
                tween._init();
                return tween;
            };

            /**
             * ??????????????????????????????????????????????????????????????????????????????????????????
             * @param target ??????????????????
             * @param toProps ????????????????????????????????????
             * @param params ????????????????????????
             */
            Tween.from = function (target, fromProps, params) {
                var tween = new Tween(target, fromProps, params);
                var tmp = tween._oldProps;
                tween._oldProps = tween._newProps;
                tween._newProps = tmp;
                tween._reverseFlag = -1;

                for (var p in tween._oldProps) target[p] = tween._oldProps[p];

                tween._init();
                return tween;
            };

            /**
             * ?????????????????????
             */
            var Easing = Quark.Easing = {
                Linear: {},
                Quadratic: {},
                Cubic: {},
                Quartic: {},
                Quintic: {},
                Sinusoidal: {},
                Exponential: {},
                Circular: {},
                Elastic: {},
                Back: {},
                Bounce: {}
            };

            Easing.Linear.EaseNone = function (k) {
                return k;
            };

            Easing.Quadratic.EaseIn = function (k) {
                return k * k;
            };

            Easing.Quadratic.EaseOut = function (k) {
                return -k * (k - 2);
            };

            Easing.Quadratic.EaseInOut = function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k;
                return -0.5 * (--k * (k - 2) - 1);
            };

            Easing.Cubic.EaseIn = function (k) {
                return k * k * k;
            };

            Easing.Cubic.EaseOut = function (k) {
                return --k * k * k + 1;
            };

            Easing.Cubic.EaseInOut = function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k;
                return 0.5 * ((k -= 2) * k * k + 2);
            };

            Easing.Quartic.EaseIn = function (k) {
                return k * k * k * k;
            };

            Easing.Quartic.EaseOut = function (k) {
                return -(--k * k * k * k - 1);
            }

            Easing.Quartic.EaseInOut = function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k * k;
                return -0.5 * ((k -= 2) * k * k * k - 2);
            };

            Easing.Quintic.EaseIn = function (k) {
                return k * k * k * k * k;
            };

            Easing.Quintic.EaseOut = function (k) {
                return (k = k - 1) * k * k * k * k + 1;
            };

            Easing.Quintic.EaseInOut = function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
                return 0.5 * ((k -= 2) * k * k * k * k + 2);
            };

            Easing.Sinusoidal.EaseIn = function (k) {
                return -Math.cos(k * Math.PI / 2) + 1;
            };

            Easing.Sinusoidal.EaseOut = function (k) {
                return Math.sin(k * Math.PI / 2);
            };

            Easing.Sinusoidal.EaseInOut = function (k) {
                return -0.5 * (Math.cos(Math.PI * k) - 1);
            };

            Easing.Exponential.EaseIn = function (k) {
                return k == 0 ? 0 : Math.pow(2, 10 * (k - 1));
            };

            Easing.Exponential.EaseOut = function (k) {
                return k == 1 ? 1 : -Math.pow(2, -10 * k) + 1;
            };

            Easing.Exponential.EaseInOut = function (k) {
                if (k == 0) return 0;
                if (k == 1) return 1;
                if ((k *= 2) < 1) return 0.5 * Math.pow(2, 10 * (k - 1));
                return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
            };

            Easing.Circular.EaseIn = function (k) {
                return -(Math.sqrt(1 - k * k) - 1);
            };

            Easing.Circular.EaseOut = function (k) {
                return Math.sqrt(1 - --k * k);
            };

            Easing.Circular.EaseInOut = function (k) {
                if ((k /= 0.5) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
                return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
            };

            Easing.Elastic.EaseIn = function (k) {
                var s, a = 0.1,
                    p = 0.4;
                if (k == 0) return 0;
                else if (k == 1) return 1;
                else if (!p) p = 0.3;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else s = p / (2 * Math.PI) * Math.asin(1 / a);
                return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            };

            Easing.Elastic.EaseOut = function (k) {
                var s, a = 0.1,
                    p = 0.4;
                if (k == 0) return 0;
                else if (k == 1) return 1;
                else if (!p) p = 0.3;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else s = p / (2 * Math.PI) * Math.asin(1 / a);
                return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
            };

            Easing.Elastic.EaseInOut = function (k) {
                var s, a = 0.1,
                    p = 0.4;
                if (k == 0) return 0;
                else if (k == 1) return 1;
                else if (!p) p = 0.3;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else s = p / (2 * Math.PI) * Math.asin(1 / a);
                if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
                return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;

            };

            Easing.Back.EaseIn = function (k) {
                var s = 1.70158;
                return k * k * ((s + 1) * k - s);
            };

            Easing.Back.EaseOut = function (k) {
                var s = 1.70158;
                return (k = k - 1) * k * ((s + 1) * k + s) + 1;
            };

            Easing.Back.EaseInOut = function (k) {
                var s = 1.70158 * 1.525;
                if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
                return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
            };

            Easing.Bounce.EaseIn = function (k) {
                return 1 - Easing.Bounce.EaseOut(1 - k);
            };

            Easing.Bounce.EaseOut = function (k) {
                if ((k /= 1) < (1 / 2.75)) {
                    return 7.5625 * k * k;
                } else if (k < (2 / 2.75)) {
                    return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                } else if (k < (2.5 / 2.75)) {
                    return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                } else {
                    return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                }
            };

            Easing.Bounce.EaseInOut = function (k) {
                if (k < 0.5) return Easing.Bounce.EaseIn(k * 2) * 0.5;
                return Easing.Bounce.EaseOut(k * 2 - 1) * 0.5 + 0.5;
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name Audio
             * @class Audio????????????Audio????????????
             * @param src ??????????????????????????????
             * @param preload ????????????????????????????????????????????????????????????IOS??????Safari???
             * @param autoPlay ????????????????????????????????????????????????????????????IOS??????Safari???
             * @param loop ???????????????????????????
             */
            var Audio = Quark.Audio = function (src, preload, autoPlay, loop) {
                Audio.superClass.constructor.call(this);

                this.src = src;
                this.autoPlay = preload && autoPlay;
                this.loop = loop;

                this._loaded = false;
                this._playing = false;
                this._evtHandler = Quark.delegate(this._evtHandler, this);

                this._element = document.createElement('audio');
                this._element.preload = preload;
                this._element.src = src;
                if (preload) this.load();
            };
            Quark.inherit(Audio, Quark.EventDispatcher);

            /**
             * ???????????????????????????
             */
            Audio.prototype.load = function () {
                this._element.addEventListener("progress", this._evtHandler, false);
                this._element.addEventListener("ended", this._evtHandler, false);
                this._element.addEventListener("error", this._evtHandler, false);
                try {
                    this._element.load();
                } catch (e) {
                    trace(e);
                }
                ;

            };

            /**
             * ??????????????????????????????
             * @private
             */
            Audio.prototype._evtHandler = function (e) {
                if (e.type == "progress") {
                    var i = 0,
                        buffered = 0,
                        ranges = e.target.buffered;
                    if (ranges && ranges.length > 0) {
                        for (i = ranges.length - 1; i >= 0; i--) {
                            buffered = (ranges.end(i) - ranges.start(i));
                        }
                    }
                    var percent = buffered / e.target.duration;
                    if (percent >= 1) {
                        this._element.removeEventListener("progress", this._evtHandler);
                        this._element.removeEventListener("error", this._evtHandler);
                        this._loaded = true;
                        this.dispatchEvent({
                            type: "loaded",
                            target: this
                        });
                        if (this.autoPlay) this.play();
                    }
                } else if (e.type == "ended") {
                    this.dispatchEvent({
                        type: "ended",
                        target: this
                    });
                    if (this.loop) this.play();
                    else this._playing = false;
                } else if (e.type == "error") {
                    trace("Quark.Audio Error: " + e.target.src);
                }
            };

            /**
             * ???????????????
             */
            Audio.prototype.play = function () {
                if (this._loaded) {
                    this._element.play();
                    this._playing = true;
                } else {
                    this.autoPlay = true;
                    this.load();
                }
            };

            /**
             * ???????????????
             */
            Audio.prototype.stop = function () {
                if (this._playing) {
                    this._element.pause();
                    this._playing = false;
                }
            };

            /**
             * ???????????????????????????????????????
             */
            Audio.prototype.loaded = function () {
                return this._loaded;
            };

            /**
             * ??????????????????????????????
             */
            Audio.prototype.playing = function () {
                return this._playing;
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name Drawable
             * @class Drawable?????????????????????DOM???????????????????????????HTMLImageElement???HTMLCanvasElement???HTMLVideoElement???????????????????????????canvas???dom??????????????????????????????????????????dom??????????????????canvas?????????
             * @param drawable ????????????????????????
             * @param {Boolean} isDOM ????????????drawable???????????????DOM??????????????????false???
             */
            var Drawable = Quark.Drawable = function (drawable, isDOM) {
                this.rawDrawable = null;
                this.domDrawable = null;
                this.set(drawable, isDOM);
            };

            /**
             * ??????context????????????????????????Drawable??????????????????
             * @param {DisplayObject} obj ????????????????????????
             * @param {Context} context ???????????????????????????
             * @return ?????????????????????????????????
             */
            Drawable.prototype.get = function (obj, context) {
                if (context == null || context.canvas.getContext != null) {
                    return this.rawDrawable;
                } else {
                    if (this.domDrawable == null) {
                        this.domDrawable = Quark.createDOMDrawable(obj, {
                            image: this.rawDrawable
                        });
                    }
                    return this.domDrawable;
                }
            };

            /**
             * ??????Drawable?????????
             * @param drawable ????????????????????????
             * @param {Boolean} isDOM ????????????drawable???????????????DOM??????????????????false???
             */
            Drawable.prototype.set = function (drawable, isDOM) {
                if (isDrawable(drawable)) this.rawDrawable = drawable;
                if (isDOM === true) {
                    this.domDrawable = drawable;
                } else if (this.domDrawable) {
                    this.domDrawable.style.backgroundImage = "url(" + this.rawDrawable.src + ")";
                }
            };

            function isDrawable(elem) {
                if (elem == null) return false;
                return (elem instanceof HTMLImageElement) ||
                    (elem instanceof HTMLCanvasElement) ||
                    (elem instanceof HTMLVideoElement);
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name DisplayObject
             * @class DisplayObject?????????????????????????????????????????????????????????DisplayObject????????????????????????????????????????????????????????????DisplayObject??????????????????????????????????????????drawable?????????
             * @augments EventDispatcher
             * @property id DisplayObject?????????????????????id???
             * @property name DisplayObject??????????????????
             * @property x DisplayObject????????????????????????x????????????
             * @property y DisplayObject????????????????????????y????????????
             * @property regX DisplayObject????????????????????????????????????x????????????
             * @property regY DisplayObject????????????????????????????????????y????????????
             * @property width DisplayObject???????????????
             * @property height DisplayObject???????????????
             * @property alpha DisplayObject????????????????????????????????????0-1????????????1???
             * @property scaleX DisplayObject?????????x????????????????????????????????????0-1???
             * @property scaleY DisplayObject?????????y????????????????????????????????????0-1???
             * @property rotation DisplayObject?????????????????????????????????0???
             * @property visible ??????DisplayObject??????????????????????????????true???
             * @property eventEnabled ??????DisplayObject????????????????????????????????????mousedown???touchstart???????????????true???
             * @property transformEnabled ??????DisplayObject????????????????????????????????????false???
             * @property useHandCursor ??????DisplayObject???????????????????????????????????????????????????false???
             * @property polyArea ??????DisplayObject??????????????????????????????????????????null???????????????????????????????????????
             * @property mask ??????DisplayObject???????????????????????????????????????DOMContext??????????????????webkit???????????????????????????null???
             * @property parent DisplayObject????????????????????????????????????
             */
            var DisplayObject = Quark.DisplayObject = function (props) {
                this.id = Quark.UIDUtil.createUID("DisplayObject");

                this.name = null;
                this.x = 0;
                this.y = 0;
                this.regX = 0;
                this.regY = 0;
                this.width = 0;
                this.height = 0;
                this.alpha = 1;
                this.scaleX = 1;
                this.scaleY = 1;
                this.rotation = 0;
                this.visible = true;
                this.eventEnabled = true;
                this.transformEnabled = true;
                this.useHandCursor = false;
                this.polyArea = null;
                this.mask = null;

                this.drawable = null;
                this.parent = null;
                this.context = null;

                this._depth = 0;
                this._lastState = {};
                this._stateList = ["x", "y", "regX", "regY", "width", "height", "alpha", "scaleX", "scaleY", "rotation", "visible", "_depth"];

                Quark.merge(this, props, true);
                if (props.mixin) Quark.merge(this, props.mixin, false);

                DisplayObject.superClass.constructor.call(this, props);
            };
            Quark.inherit(DisplayObject, Quark.EventDispatcher);

            /**
             * ???????????????????????????????????????Image???????????????????????????????????????DOM?????????
             * @param {Object} drawable ?????????????????????????????????????????????Image?????????
             */
            DisplayObject.prototype.setDrawable = function (drawable) {
                if (this.drawable == null) {
                    this.drawable = new Quark.Drawable(drawable);
                } else if (this.drawable.rawDrawable != drawable) {
                    this.drawable.set(drawable);
                }
            };

            /**
             * ?????????????????????????????????Image???Canvas?????????DOM?????????
             * @param {Context} context ??????????????????
             */
            DisplayObject.prototype.getDrawable = function (context) {
                //context = context || this.context || this.getStage().context;
                return this._cache || this.drawable && this.drawable.get(this, context);
            };

            /**
             * ????????????????????????????????????????????????????????????????????????????????????????????????update?????????
             * @protected
             */
            DisplayObject.prototype._update = function (timeInfo) {
                this.update(timeInfo);
            };

            /**
             * ?????????????????????????????????????????????????????????????????????????????????
             * @param {Object} timeInfo ????????????????????????????????????
             * @return {Boolean} ??????????????????true????????????false???
             */
            DisplayObject.prototype.update = function (timeInfo) {
                return true;
            };

            /**
             * ??????????????????????????????????????????????????????????????????????????????????????????render?????????
             * @protected
             */
            DisplayObject.prototype._render = function (context) {
                var ctx = this.context || context;
                if (!this.visible || this.alpha <= 0) {
                    if (ctx.hide != null) ctx.hide(this);
                    this.saveState(["visible", "alpha"]);
                    return;
                }

                ctx.startDraw();
                ctx.transform(this);
                this.render(ctx);
                ctx.endDraw();
                this.saveState();
            };

            /**
             * DisplayObject?????????????????????????????????????????????????????????????????????
             * @param {Context} context ??????????????????
             */
            DisplayObject.prototype.render = function (context) {
                context.draw(this, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
            };

            /**
             * ??????DisplayObject????????????????????????????????????????????????
             * @param {Array} list ??????????????????????????????????????????null???
             */
            DisplayObject.prototype.saveState = function (list) {
                list = list || this._stateList;
                var state = this._lastState;
                for (var i = 0, len = list.length; i < len; i++) {
                    var p = list[i];
                    state["last" + p] = this[p];
                }
            };

            /**
             * ??????DisplayObject?????????????????????????????????????????????????????????
             * @param {String} propName ?????????????????????????????????
             * @return ???????????????????????????????????????????????????
             */
            DisplayObject.prototype.getState = function (propName) {
                return this._lastState["last" + propName];
            };

            /**
             * ??????DisplayObject????????????????????????????????????????????????????????????????????????????????????????????????
             * @param prop ???????????????????????????????????????
             * @return ??????????????????true???????????????false???
             */
            DisplayObject.prototype.propChanged = function (prop) {
                var list = arguments.length > 0 ? arguments : this._stateList;
                for (var i = 0, len = list.length; i < len; i++) {
                    var p = list[i];
                    if (this._lastState["last" + p] != this[p]) return true;
                }
                return false;
            };

            /**
             * ??????DisplayObject????????????????????????????????????x???y???????????????????????????????????????????????????
             * @param {Number} x ??????????????????x?????????
             * @param {Number} y ??????????????????y?????????
             * @param {Boolean} usePolyCollision ?????????????????????????????????????????????false???
             * @return {Number} ???????????????????????????1?????????????????????0???????????????-1???
             */
            DisplayObject.prototype.hitTestPoint = function (x, y, usePolyCollision) {
                return Quark.hitTestPoint(this, x, y, usePolyCollision);
            };

            /**
             * ??????DisplayObject????????????????????????????????????object????????????????????????????????????????????????
             * @param {DisplayObject} object ????????????????????????????????????
             * @param {Boolean} usePolyCollision ?????????????????????????????????????????????false???
             * @return {Boolean} ????????????true???????????????false???
             */
            DisplayObject.prototype.hitTestObject = function (object, usePolyCollision) {
                return Quark.hitTestObject(this, object, usePolyCollision);
            };

            /**
             * ???x???y????????????????????????????????????????????????????????????????????????????????????
             * @param {Number} x ?????????????????????x????????????
             * @param {Number} y ?????????????????????y????????????
             * @return {Object} ???????????????????????????????????????????????????{x:10, y:10}???
             */
            DisplayObject.prototype.localToGlobal = function (x, y) {
                var cm = this.getConcatenatedMatrix();
                return {
                    x: cm.tx + x,
                    y: cm.ty + y
                };
            };

            /**
             * ???x???y????????????????????????????????????????????????????????????????????????????????????
             * @param {Number} x ?????????????????????x????????????
             * @param {Number} y ?????????????????????y????????????
             * @return {Object} ???????????????????????????????????????????????????{x:10, y:10}???
             */
            DisplayObject.prototype.globalToLocal = function (x, y) {
                var cm = this.getConcatenatedMatrix().invert();
                return {
                    x: cm.tx + x,
                    y: cm.ty + y
                };
            };

            /**
             * ???x???y?????????????????????????????????????????????????????????????????????????????????????????????
             * @param {Number} x ?????????????????????x????????????
             * @param {Number} y ?????????????????????y????????????
             * @return {Object} ???????????????????????????????????????????????????????????????{x:10, y:10}???
             */
            DisplayObject.prototype.localToTarget = function (x, y, target) {
                var p = this.localToGlobal(x, y);
                return target.globalToLocal(p.x, p.y);
            };

            /**
             * ?????????????????????????????????????????????????????????????????????????????????
             * @private
             */
            DisplayObject.prototype.getConcatenatedMatrix = function (ancestor) {
                var mtx = new Quark.Matrix(1, 0, 0, 1, 0, 0);
                if (ancestor == this) return mtx;
                for (var o = this; o.parent != null && o.parent != ancestor; o = o.parent) {
                    var cos = 1,
                        sin = 0;
                    if (o.rotation % 360 != 0) {
                        var r = o.rotation * Quark.DEG_TO_RAD;
                        cos = Math.cos(r);
                        sin = Math.sin(r);
                    }

                    if (o.regX != 0) mtx.tx -= o.regX;
                    if (o.regY != 0) mtx.ty -= o.regY;

                    mtx.concat(new Quark.Matrix(cos * o.scaleX, sin * o.scaleX, -sin * o.scaleY, cos * o.scaleY, o.x, o.y));
                }
                return mtx;
            };

            /**
             * ??????DisplayObject?????????????????????????????????????????????????????????????????????
             * @return {Object} ????????????????????????????????????
             */
            DisplayObject.prototype.getBounds = function () {
                var w = this.width,
                    h = this.height;
                var mtx = this.getConcatenatedMatrix();

                var poly = this.polyArea || [{
                    x: 0,
                    y: 0
                }, {
                    x: w,
                    y: 0
                }, {
                    x: w,
                    y: h
                }, {
                    x: 0,
                    y: h
                }];

                var vertexs = [],
                    len = poly.length,
                    v, minX, maxX, minY, maxY;
                v = mtx.transformPoint(poly[0], true, true);
                minX = maxX = v.x;
                minY = maxY = v.y;
                vertexs[0] = v;

                for (var i = 1; i < len; i++) {
                    var v = mtx.transformPoint(poly[i], true, true);
                    if (minX > v.x) minX = v.x;
                    else if (maxX < v.x) maxX = v.x;
                    if (minY > v.y) minY = v.y;
                    else if (maxY < v.y) maxY = v.y;
                    vertexs[i] = v;
                }

                vertexs.x = minX;
                vertexs.y = minY;
                vertexs.width = maxX - minX;
                vertexs.height = maxY - minY;
                return vertexs;
            };

            /**
             * ??????DisplayObject???????????????????????????
             * @return {Number} ?????????????????????????????????
             */
            DisplayObject.prototype.getCurrentWidth = function () {
                return Math.abs(this.width * this.scaleX);
            };

            /**
             * ??????DisplayObject???????????????????????????
             * @return {Number} ?????????????????????????????????
             */
            DisplayObject.prototype.getCurrentHeight = function () {
                return Math.abs(this.height * this.scaleY);
            };

            /**
             * ??????DisplayObject????????????????????????????????????????????????????????????null???
             * @return {Stage} ????????????????????????
             */
            DisplayObject.prototype.getStage = function () {
                var obj = this;
                while (obj.parent) obj = obj.parent;
                if (obj instanceof Quark.Stage) return obj;
                return null;
            };

            /**
             * ???DisplayObject???????????????????????????canvas????????????????????????????????????????????????????????????????????????????????????????????????
             * @param {Boolean} toImage ???????????????????????????DataURL?????????????????????false???
             * @param {String} type ???????????????DataURL???????????????mime??????????????????"image/png"???
             * @return {Object} ??????????????????????????????????????????toImage???????????????Canvas???Image?????????
             */
            Quark.DisplayObject.prototype.cache = function (toImage, type) {
                return this._cache = Quark.cacheObject(this, toImage, type);
            };

            /**
             * ???????????????
             */
            Quark.DisplayObject.prototype.uncache = function () {
                this._cache = null;
            };

            /**
             * ???DisplayObject???????????????dataURL??????????????????
             * @param {String} type ???????????????DataURL???????????????mime??????????????????"image/png"???
             */
            Quark.DisplayObject.prototype.toImage = function (type) {
                return Quark.cacheObject(this, true, type);
            };

            /**
             * ??????DisplayObject???????????????????????????????????????????????????debug??????Stage1.Container2.Bitmap3???
             * @return {String} ??????????????????????????????????????????????????????Stage1.Container2.Bitmap3???
             */
            DisplayObject.prototype.toString = function () {
                return Quark.UIDUtil.displayObjectToString(this);
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name DisplayObjectContainer
             * @augments DisplayObject
             * @class DisplayObjectContainer????????????DisplayObject?????????????????????????????????????????????????????????DisplayObjectContainer?????????????????????????????????children????????????????????????Z?????????????????????DisplayObjectContainer????????????????????????0??????autoSize=false??????????????????????????????????????????
             * @property eventChildren ??????DisplayObjectContainer??????????????????????????????????????????mousedown???touchstart???????????????true???
             * @property autoSize ??????DisplayObjectContainer????????????????????????????????????????????????false???
             */
            var DisplayObjectContainer = Quark.DisplayObjectContainer = function (props) {
                this.eventChildren = true;
                this.autoSize = false;
                this.children = [];

                props = props || {};
                DisplayObjectContainer.superClass.constructor.call(this, props);
                this.id = props.id || Quark.UIDUtil.createUID("DisplayObjectContainer");

                this.setDrawable(props.drawable || props.image || null);

                if (props.children) {
                    for (var i = 0; i < props.children.length; i++) {
                        this.addChild(props.children[i]);
                    }
                }
            };
            Quark.inherit(DisplayObjectContainer, Quark.DisplayObject);

            /**
             * ?????????DisplayObject?????????????????????DisplayObjectContainer??????????????????????????????????????????
             * @param {DisplayObject} child ???????????????????????????
             * @param {Integer} index ???????????????????????????????????????????????????
             * @return {DisplayObjectContainer} ???????????????????????????
             */
            DisplayObjectContainer.prototype.addChildAt = function (child, index) {
                if (index < 0) index = 0;
                else if (index > this.children.length) index = this.children.length;

                var childIndex = this.getChildIndex(child);
                if (childIndex != -1) {
                    if (childIndex == index) return this;
                    this.children.splice(childIndex, 1);
                } else if (child.parent) {
                    child.parent.removeChild(child);
                }

                this.children.splice(index, 0, child);
                child.parent = this;

                if (this.autoSize) {
                    var rect = new Quark.Rectangle(0, 0, this.rectWidth || this.width, this.rectHeight || this.height);
                    var childRect = new Quark.Rectangle(child.x, child.y, child.rectWidth || child.width, child.rectHeight || child.height);
                    rect.union(childRect);
                    this.width = rect.width;
                    this.height = rect.height;
                }

                return this;
            };

            /**
             * ?????????DisplayObject?????????????????????DisplayObjectContainer???????????????????????????
             * @param {DisplayObject} child ???????????????????????????
             * @return {DisplayObjectContainer} ???????????????????????????
             */
            DisplayObjectContainer.prototype.addChild = function (child) {
                var start = this.children.length;
                for (var i = 0; i < arguments.length; i++) {
                    var child = arguments[i];
                    this.addChildAt(child, start + i);
                }
                return this;
            };

            /**
             * ???DisplayObjectContainer???????????????????????????????????????????????????
             * @param {Integer} index ????????????????????????????????????????????????
             * @return {Boolean} ??????????????????true???????????????false???
             */
            DisplayObjectContainer.prototype.removeChildAt = function (index) {
                if (index < 0 || index >= this.children.length) return false;
                var child = this.children[index];
                if (child != null) {
                    var stage = this.getStage();
                    if (stage != null) stage.context.remove(child);
                    child.parent = null;
                }
                this.children.splice(index, 1);
                return true;
            };

            /**
             * ???DisplayObjectContainer??????????????????????????????????????????
             * @param {DisplayObject} child ?????????????????????????????????
             * @return {Boolean} ??????????????????true???????????????false???
             */
            DisplayObjectContainer.prototype.removeChild = function (child) {
                return this.removeChildAt(this.children.indexOf(child));
            };

            /**
             * ??????DisplayObjectContainer?????????????????????
             */
            DisplayObjectContainer.prototype.removeAllChildren = function () {
                while (this.children.length > 0) this.removeChildAt(0);
            };

            /**
             * ??????DisplayObjectContainer?????????????????????????????????????????????
             * @param {Integer} index ???????????????????????????????????????
             * @return {DisplayObject} ?????????????????????????????????
             */
            DisplayObjectContainer.prototype.getChildAt = function (index) {
                if (index < 0 || index >= this.children.length) return null;
                return this.children[index];
            };

            /**
             * ?????????????????????DisplayObjectContainer????????????????????????????????????
             * @param {Integer} child ????????????????????????
             * @return {Integer} ?????????????????????????????????????????????
             */
            DisplayObjectContainer.prototype.getChildIndex = function (child) {
                return this.children.indexOf(child);
            };

            /**
             * ?????????????????????DisplayObjectContainer????????????????????????????????????
             * @param {DisplayObject} child ????????????????????????
             * @param {Integer} index ??????????????????????????????????????????
             */
            DisplayObjectContainer.prototype.setChildIndex = function (child, index) {
                if (child.parent != this) return;
                var oldIndex = this.children.indexOf(child);
                if (index == oldIndex) return;
                this.children.splice(oldIndex, 1);
                this.children.splice(index, 0, child);
            };

            /**
             * ?????????DisplayObjectContainer??????????????????????????????????????????????????????
             * @param {DisplayObject} child1 ??????????????????????????????????????????1???
             * @param {DisplayObject} child2 ??????????????????????????????????????????2???
             */
            DisplayObjectContainer.prototype.swapChildren = function (child1, child2) {
                var index1 = this.getChildIndex(child1),
                    index2 = this.getChildIndex(child2);
                this.children[index1] = child2;
                this.children[index2] = child1;
            };

            /**
             * ?????????DisplayObjectContainer????????????????????????????????????????????????????????????
             * @param {Integer} index1 ????????????????????????1???
             * @param {Integer} index2 ????????????????????????2???
             */
            DisplayObjectContainer.prototype.swapChildrenAt = function (index1, index2) {
                var child1 = this.getChildAt(index1),
                    child2 = this.getChildAt(index2);
                this.children[index1] = child2;
                this.children[index2] = child1;
            };

            /**
             * ??????DisplayObjectContainer?????????id?????????????????????
             * @param {String} ????????????????????????id???
             * @return {DisplayObject} ????????????id?????????????????????
             */
            DisplayObjectContainer.prototype.getChildById = function (id) {
                for (var i = 0, len = this.children.length; i < len; i++) {
                    var child = this.children[i];
                    if (child.id == id) return child;
                }
                return null;
            };

            /**
             * ???????????????DisplayObjectContainer?????????id?????????????????????
             * @param {String} ????????????????????????id???
             * @return {DisplayObject} ?????????????????????id?????????????????????
             */
            DisplayObjectContainer.prototype.removeChildById = function (id) {
                for (var i = 0, len = this.children.length; i < len; i++) {
                    if (this.children[i].id == id) {
                        return this.removeChildAt(i);
                    }
                }
                return null;
            };

            /**
             * ????????????keyOrFunction?????????????????????????????????????????????DisplayObjectContainer???????????????????????????
             * @param keyOrFunction ??????????????????????????????????????????????????????
             */
            DisplayObjectContainer.prototype.sortChildren = function (keyOrFunction) {
                var f = keyOrFunction;
                if (typeof(f) == "string") {
                    var key = f;
                    f = function (a, b) {
                        return b[key] - a[key];
                    };
                }
                this.children.sort(f);
            };

            /**
             * ???????????????????????????DisplayObjectContainer?????????????????????
             * @param {DisplayObject} child ????????????????????????
             * @return {Boolean} ???????????????DisplayObjectContainer????????????????????????true???????????????false???
             */
            DisplayObjectContainer.prototype.contains = function (child) {
                return this.getChildIndex(child) != -1;
            };

            /**
             * ??????DisplayObjectContainer??????????????????????????????
             * @return {Integer} ?????????????????????????????????
             */
            DisplayObjectContainer.prototype.getNumChildren = function () {
                return this.children.length;
            };

            /**
             * ????????????DisplayObject???_update????????????????????????????????????????????????
             * @protected
             */
            DisplayObjectContainer.prototype._update = function (timeInfo) {
                //????????????????????????????????????????????????????????????
                var result = true;
                if (this.update != null) result = this.update(timeInfo);
                if (result === false) return;

                var copy = this.children.slice(0);
                for (var i = 0, len = copy.length; i < len; i++) {
                    var child = copy[i];
                    child._depth = i + 1;
                    child._update(timeInfo);
                }
            };

            /**
             * ??????DisplayObjectContainer????????????????????????????????????
             * @param {Context} ??????????????????
             */
            DisplayObjectContainer.prototype.render = function (context) {
                DisplayObjectContainer.superClass.render.call(this, context);

                for (var i = 0, len = this.children.length; i < len; i++) {
                    var child = this.children[i];
                    child._render(context);
                }
            };

            /**
             * ??????x???y???????????????DisplayObjectContainer????????????????????????????????????????????????????????????????????????????????????????????????????????????
             * @param {Number} x ????????????x????????????
             * @param {Number} y ????????????y????????????
             * @param {Boolean} usePolyCollision ???????????????????????????????????????????????????false???
             * @param {Boolean} returnAll ???????????????????????????????????????????????????????????????false???
             * @return ????????????????????????????????????????????????returnAll???false?????????????????????????????????????????????
             */
            DisplayObjectContainer.prototype.getObjectUnderPoint = function (x, y, usePolyCollision, returnAll) {
                if (returnAll) var result = [];

                for (var i = this.children.length - 1; i >= 0; i--) {
                    var child = this.children[i];
                    if (child == null || (!child.eventEnabled && child.children == undefined) || !child.visible || child.alpha <= 0) continue;

                    if (child.children != undefined && child.eventChildren && child.getNumChildren() > 0) {
                        var obj = child.getObjectUnderPoint(x, y, usePolyCollision, returnAll);
                        if (obj) {
                            if (returnAll) {
                                if (obj.length > 0) result = result.concat(obj);
                            } else return obj;
                        } else if (child.hitTestPoint(x, y, usePolyCollision) >= 0) {
                            if (returnAll) result.push(child);
                            else return child;
                        }
                    } else {
                        if (child.hitTestPoint(x, y, usePolyCollision) >= 0) {
                            if (returnAll) result.push(child);
                            else return child;
                        }
                    }
                }
                if (returnAll) return result;
                return null;
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name Stage
             * @augments DisplayObjectContainer
             * @class ????????????????????????????????????????????????????????????????????????????????????????????????context???????????????????????????????????????????????????????????????????????????????????????????????????
             * @property stageX ?????????????????????X???????????????offsetLeft?????????????????????????????????updatePosition()???????????????
             * @property stageY ?????????????????????Y???????????????offsetTop?????????????????????????????????updatePosition()???????????????
             * @property paused ???????????????????????????????????????????????????false???
             * @argument props ??????JSON????????????{context:context} context????????????????????????
             */
            var Stage = Quark.Stage = function (props) {
                this.stageX = 0;
                this.stageY = 0;
                this.paused = false;

                this._eventTarget = null;

                props = props || {};
                Stage.superClass.constructor.call(this, props);
                this.id = props.id || Quark.UIDUtil.createUID("Stage");
                if (this.context == null) throw "Quark.Stage Error: context is required.";

                this.updatePosition();
            };
            Quark.inherit(Stage, Quark.DisplayObjectContainer);

            /**
             * ????????????Stage?????????????????????????????????Quark.Timer?????????????????????
             */
            Stage.prototype.step = function (timeInfo) {
                if (this.paused) return;
                this._update(timeInfo);
                this._render(this.context);
            };

            /**
             * ????????????Stage?????????????????????????????????
             */
            Stage.prototype._update = function (timeInfo) {
                //Stage??????????????????????????????????????????????????????update?????????
                var copy = this.children.slice(0);
                for (var i = 0, len = copy.length; i < len; i++) {
                    var child = copy[i];
                    child._depth = i + 1;
                    child._update(timeInfo);
                }
                //update??????????????????????????????????????????????????????????????????
                if (this.update != null) this.update(timeInfo);
            };

            /**
             * ????????????Stage???????????????????????????
             */
            Stage.prototype._render = function (context) {
                //???canvas??????????????????????????????????????????
                if (context.clear != null) context.clear(0, 0, this.width, this.height);
                Stage.superClass._render.call(this, context);
            };

            /**
             * ??????Stage???????????????????????????
             */
            Stage.prototype.dispatchEvent = function (e) {
                var x = e.pageX || e.clientX,
                    y = e.pageY || e.clientY;
                x = (x - this.stageX) / this.scaleX;
                y = (y - this.stageY) / this.scaleY;
                var obj = this.getObjectUnderPoint(x, y, true),
                    target = this._eventTarget;

                e.eventX = x;
                e.eventY = y;

                var leave = e.type == "mouseout" && !this.context.canvas.contains(e.relatedTarget);
                if (target != null && (target != obj || leave)) {
                    e.lastEventTarget = target;
                    //??????????????????mouseout???touchout????????????????????????
                    var outEvent = (leave || obj == null || e.type == "mousemove") ? "mouseout" : e.type == "touchmove" ? "touchout" : null;
                    if (outEvent) target.dispatchEvent({
                        type: outEvent
                    });
                    this._eventTarget = null;
                }

                //???????????????????????????
                if (obj != null && obj.eventEnabled && e.type != "mouseout") {
                    e.eventTarget = target = this._eventTarget = obj;
                    obj.dispatchEvent(e);
                }

                //??????????????????
                if (!Quark.supportTouch) {
                    var cursor = (target && target.useHandCursor && target.eventEnabled) ? "pointer" : "";
                    this.context.canvas.style.cursor = cursor;
                }

                if (leave || e.type != "mouseout") Stage.superClass.dispatchEvent.call(this, e);
            };

            /**
             * ????????????Stage?????????????????????????????????stageX/stageY???
             */
            Stage.prototype.updatePosition = function () {
                var offset = Quark.getElementOffset(this.context.canvas);
                this.stageX = offset.left;
                this.stageY = offset.top;
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name Bitmap
             * @augments DisplayObject
             * @class Bitmap??????????????????????????????????????????????????????????????????Image???????????????????????????????????????
             * @argument {Object} props ????????????????????????????????????
             * <p>image - Image?????????</p>
             * <p>rect - Image????????????????????????????????????[0,0,100,100]</p>
             */
            var Bitmap = Quark.Bitmap = function (props) {
                this.image = null;
                this.rectX = 0; //ready-only
                this.rectY = 0; //ready-only
                this.rectWidth = 0; //ready-only
                this.rectHeight = 0; //ready-only

                props = props || {};
                Bitmap.superClass.constructor.call(this, props);
                this.id = props.id || Quark.UIDUtil.createUID("Bitmap");

                this.setRect(props.rect || [0, 0, this.image.width, this.image.height]);
                this.setDrawable(this.image);
                this._stateList.push("rectX", "rectY", "rectWidth", "rectHeight");
            };
            Quark.inherit(Bitmap, Quark.DisplayObject);

            /**
             * ??????Bitmap?????????image??????????????????
             * @param {Array} rect ?????????????????????????????????????????????[rectX, rectY, rectWidth, rectHeight]???
             */
            Bitmap.prototype.setRect = function (rect) {
                this.rectX = rect[0];
                this.rectY = rect[1];
                this.rectWidth = this.width = rect[2];
                this.rectHeight = this.height = rect[3];
            };

            /**
             * ????????????????????????????????????image????????????????????????
             * @param {Context} context ??????????????????
             */
            Bitmap.prototype.render = function (context) {
                context.draw(this, this.rectX, this.rectY, this.rectWidth, this.rectHeight, 0, 0, this.width, this.height);
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name MovieClip
             * @augments Bitmap
             * @class MovieClip?????????????????????????????????????????????MovieClip??????Image??????????????????????????????????????????????????????????????????????????????????????????frame?????????????????????{rect:*required*, label:"", interval:0, stop:0, jump:-1}???
             */
            var MovieClip = Quark.MovieClip = function (props) {
                this.interval = 0;
                this.paused = false;
                this.useFrames = false;
                this.currentFrame = 0; //read-only

                this._frames = [];
                this._frameLabels = {};
                this._frameDisObj = null;
                this._displayedCount = 0;

                props = props || {};
                MovieClip.superClass.constructor.call(this, props);
                this.id = props.id || Quark.UIDUtil.createUID("MovieClip");

                if (props.frames) this.addFrame(props.frames);
            };
            Quark.inherit(MovieClip, Quark.Bitmap);

            /**
             * ???MovieClip????????????frame??????????????????????????????????????????
             */
            MovieClip.prototype.addFrame = function (frame) {
                var start = this._frames.length;
                if (frame instanceof Array) {
                    for (var i = 0; i < frame.length; i++) this.setFrame(frame[i], start + i);
                } else {
                    this.setFrame(frame, start);
                }
                return this;
            };

            /**
             * ?????????frame???MovieClip?????????????????????????????????0????????????
             */
            MovieClip.prototype.setFrame = function (frame, index) {
                if (index == undefined || index > this._frames.length) index = this._frames.length;
                else if (index < 0) index = 0;

                this._frames[index] = frame;
                if (frame.label) this._frameLabels[frame.label] = frame;
                if (frame.interval == undefined) frame.interval = this.interval;
                if (index == 0 && this.currentFrame == 0) this.setRect(frame.rect);
            };

            /**
             * ?????????????????????????????????frame???
             */
            MovieClip.prototype.getFrame = function (indexOrLabel) {
                if (typeof(indexOrLabel) == "number") return this._frames[indexOrLabel];
                return this._frameLabels[indexOrLabel];
            };

            /**
             * ??????????????????????????????????????????
             */
            MovieClip.prototype.play = function () {
                this.paused = false;
            };

            /**
             * ???????????????????????????
             */
            MovieClip.prototype.stop = function () {
                this.paused = true;
            };

            /**
             * ?????????????????????????????????????????????????????????????????????
             */
            MovieClip.prototype.gotoAndStop = function (indexOrLabel) {
                this.currentFrame = this.getFrameIndex(indexOrLabel);
                this.paused = true;
            };

            /**
             * ?????????????????????????????????????????????????????????????????????
             */
            MovieClip.prototype.gotoAndPlay = function (indexOrLabel) {
                this.currentFrame = this.getFrameIndex(indexOrLabel);
                this.paused = false;
            };

            /**
             * ??????????????????????????????????????????
             */
            MovieClip.prototype.getFrameIndex = function (indexOrLabel) {
                if (typeof(indexOrLabel) == "number") return indexOrLabel;
                var frame = this._frameLabels[indexOrLabel],
                    frames = this._frames;
                for (var i = 0; i < frames.length; i++) {
                    if (frame == frames[i]) return i;
                }
                return -1;
            };

            /**
             * ?????????????????????????????????
             */
            MovieClip.prototype.nextFrame = function (displayedDelta) {
                var frame = this._frames[this.currentFrame];

                if (frame.interval > 0) {
                    var count = this._displayedCount + displayedDelta;
                    this._displayedCount = frame.interval > count ? count : 0;
                }

                if (frame.jump >= 0 || typeof(frame.jump) == "string") {
                    if (this._displayedCount == 0 || !frame.interval) {
                        return this.currentFrame = this.getFrameIndex(frame.jump);
                    }
                }

                if (frame.interval > 0 && this._displayedCount > 0) return this.currentFrame;
                else if (this.currentFrame >= this._frames.length - 1) return this.currentFrame = 0;
                else return ++this.currentFrame;
            };

            /**
             * ??????MovieClip????????????
             */
            MovieClip.prototype.getNumFrames = function () {
                return this._frames.length;
            };

            /**
             * ??????MovieClip??????????????????
             */
            MovieClip.prototype._update = function (timeInfo) {
                var frame = this._frames[this.currentFrame];
                if (frame.stop) {
                    this.stop();
                    return;
                }

                if (!this.paused) {
                    var delta = this.useFrames ? 1 : timeInfo && timeInfo.deltaTime;
                    frame = this._frames[this.nextFrame(delta)];
                }
                this.setRect(frame.rect);

                MovieClip.superClass._update.call(this, timeInfo);
            };

            /**
             * ???????????????????????????
             */
            MovieClip.prototype.render = function (context) {
                var frame = this._frames[this.currentFrame],
                    rect = frame.rect;
                context.draw(this, rect[0], rect[1], rect[2], rect[3], 0, 0, this.width, this.height);
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name Button
             * @augments DisplayObjectContainer
             * @class Button????????????DisplayObjectContainer??????Quark???????????????????????????
             * @argument {Object} props ????????????????????????????????????
             * <p>image - Image?????????</p>
             * <p>up - ??????????????????????????????????????????????????????[0,0,50,50]???
             * <p>over - ??????????????????????????????????????????????????????[50,0,50,50]???
             * <p>down - ??????????????????????????????????????????????????????[100,0,50,50]???
             * <p>disabled - ?????????????????????????????????????????????????????????[150,0,50,50]???
             */
            var Button = Quark.Button = function (props) {
                this.state = Button.UP;
                this.enabled = true;

                props = props || {};
                Button.superClass.constructor.call(this, props);
                this.id = props.id || Quark.UIDUtil.createUID("Button");

                this._skin = new Quark.MovieClip({
                    id: "skin",
                    image: props.image
                });
                this.addChild(this._skin);
                this._skin.stop();

                this.eventChildren = false;
                if (props.useHandCursor === undefined) this.useHandCursor = true;
                if (props.up) this.setUpState(props.up);
                if (props.over) this.setOverState(props.over);
                if (props.down) this.setDownState(props.down);
                if (props.disabled) this.setDisabledState(props.disabled);
            };
            Quark.inherit(Button, Quark.DisplayObjectContainer);

            /**
             * ????????????????????????????????????
             */
            Button.UP = "up";
            /**
             * ????????????????????????????????????
             */
            Button.OVER = "over";
            /**
             * ????????????????????????????????????
             */
            Button.DOWN = "down";
            /**
             * ???????????????????????????????????????
             */
            Button.DISABLED = "disabled";

            /**
             * ???????????????????????????????????????
             * @param {Array} upState ???????????????????????????
             * @return {Button} ?????????????????????
             */
            Button.prototype.setUpState = function (upState) {
                upState.label = Button.UP;
                this._skin.setFrame(upState, 0);
                this.upState = upState;
                return this;
            };

            /**
             * ???????????????????????????????????????
             * @param {Array} overState ???????????????????????????
             * @return {Button} ?????????????????????
             */
            Button.prototype.setOverState = function (overState) {
                overState.label = Button.OVER;
                this._skin.setFrame(overState, 1);
                this.overState = overState;
                return this;
            };

            /**
             * ???????????????????????????????????????
             * @param {Array} downState ???????????????????????????
             * @return {Button} ?????????????????????
             */
            Button.prototype.setDownState = function (downState) {
                downState.label = Button.DOWN;
                this._skin.setFrame(downState, 2);
                this.downState = downState;
                return this;
            };

            /**
             * ??????????????????????????????????????????
             * @param {Array} disabledState ??????????????????????????????
             * @return {Button} ?????????????????????
             */
            Button.prototype.setDisabledState = function (disabledState) {
                disabledState.label = Button.DISABLED;
                this._skin.setFrame(disabledState, 3);
                this.disabledState = disabledState;
                return this;
            };

            /**
             * ???????????????????????????
             * @param {Boolean} enabled ????????????????????????????????????false???
             * @return {Button} ?????????????????????
             */
            Button.prototype.setEnabled = function (enabled) {
                if (this.enabled == enabled) return this;
                this.eventEnabled = this.enabled = enabled;
                if (!enabled) {
                    if (this.disabledState) this._skin.gotoAndStop(Button.DISABLED);
                    else this._skin.gotoAndStop(Button.UP);
                } else {
                    if (this._skin.currentFrame == 3) this._skin.gotoAndStop(Button.UP);
                }
                return this;
            };

            /**
             * ??????????????????????????????
             * @param {String} state ??????????????????????????????
             * @return {Button} ?????????????????????
             */
            Button.prototype.changeState = function (state) {
                if (this.state == state) return;
                this.state = state;

                switch (state) {
                    case Button.OVER:
                    case Button.DOWN:
                    case Button.UP:
                        if (!this.enabled) this.eventEnabled = this.enabled = true;
                        this._skin.gotoAndStop(state);
                        break;
                    case Button.DISABLED:
                        this.setEnabled(false);
                        break;
                }
                return this;
            };

            /**
             * ????????????????????????????????????
             * @private
             */
            Button.prototype.dispatchEvent = function (e) {
                if (!this.enabled) return;

                switch (e.type) {
                    case "mousemove":
                        if (this.overState) this.changeState(Button.OVER);
                        break;
                    case "mousedown":
                    case "touchstart":
                    case "touchmove":
                        if (this.downState) this.changeState(Button.DOWN);
                        break;
                    case "mouseup":
                        if (this.overState) this.changeState(Button.OVER);
                        else this.changeState(Button.UP);
                        break;
                    case "mouseout":
                    case "touchout":
                    case "touchend":
                        if (this.upState) this.changeState(Button.UP);
                        break;
                }
                Button.superClass.dispatchEvent.call(this, e);
            };

            /**
             * ???Button???drawable?????????????????????image?????????????????????Button????????????
             * @private
             */
            Button.prototype.setDrawable = function (drawable) {
                Button.superClass.setDrawable.call(this, null);
            };

        })();


        (function () {

            /**
             * ????????????.
             * @name Graphics
             * @augments DisplayObject
             * @class Graphics?????????????????????????????????????????????
             */
            var Graphics = Quark.Graphics = function (props) {
                this.lineWidth = 1;
                this.strokeStyle = "0";
                this.lineAlpha = 1;
                this.lineCap = null; //"butt", "round", "square"
                this.lineJoin = null; //"miter", "round", "bevel"
                this.miterLimit = 10;

                this.hasStroke = false;
                this.hasFill = false;

                this.fillStyle = "0";
                this.fillAlpha = 1;

                props = props || {};
                Graphics.superClass.constructor.call(this, props);
                this.id = Quark.UIDUtil.createUID("Graphics");

                this._actions = [];
                this._cache = null;
            };
            Quark.inherit(Graphics, Quark.DisplayObject);

            /**
             * ????????????????????????????????????
             */
            Graphics.prototype.lineStyle = function (thickness, lineColor, alpha, lineCap, lineJoin, miterLimit) {
                this._addAction(["lineWidth", (this.lineWidth = thickness || 1)]);
                this._addAction(["strokeStyle", (this.strokeStyle = lineColor || "0")]);
                this._addAction(["lineAlpha", (this.lineAlpha = alpha || 1)]);
                if (lineCap != undefined) this._addAction(["lineCap", (this.lineCap = lineCap)]);
                if (lineJoin != undefined) this._addAction(["lineJoin", (this.lineJoin = lineJoin)]);
                if (miterLimit != undefined) this._addAction(["miterLimit", (this.miterLimit = miterLimit)]);
                this.hasStroke = true;
                return this;
            };

            /**
             * ????????????????????????????????????????????????
             */
            Graphics.prototype.beginFill = function (fill, alpha) {
                this._addAction(["fillStyle", (this.fillStyle = fill)]);
                this._addAction(["fillAlpha", (this.fillAlpha = alpha || 1)]);
                this.hasFill = true;
                return this;
            };

            /**
             * ?????????????????????????????????????????????????????????
             */
            Graphics.prototype.endFill = function () {
                if (this.hasStroke) this._addAction(["stroke"]);
                if (this.hasFill) this._addAction(["fill"]);
                return this;
            };

            /**
             * ????????????????????????????????????????????????
             */
            Graphics.prototype.beginLinearGradientFill = function (x0, y0, x1, y1, colors, ratios) {
                var gradient = Graphics._getContext().createLinearGradient(x0, y0, x1, y1);
                for (var i = 0, len = colors.length; i < len; i++) {
                    gradient.addColorStop(ratios[i], colors[i]);
                }
                return this._addAction(["fillStyle", (this.fillStyle = gradient)]);
            };

            /**
             * ???????????????????????????????????????????????????
             */
            Graphics.prototype.beginRadialGradientFill = function (x0, y0, r0, x1, y1, r1, colors, ratios) {
                var gradient = Graphics._getContext().createRadialGradient(x0, y0, r0, x1, y1, r1);
                for (var i = 0, len = colors.length; i < len; i++) {
                    gradient.addColorStop(ratios[i], colors[i]);
                }
                return this._addAction(["fillStyle", (this.fillStyle = gradient)]);
            };

            /**
             * ?????????????????????????????????
             * @param {HTMLImageElement} image ???????????????Image?????????
             * @param {String} repetition ????????????????????????????????????????????????????????????????????????repeat, repeat-x, repeat-y, no-repeat????????????""???
             */
            Graphics.prototype.beginBitmapFill = function (image, repetition) {
                var pattern = Graphics._getContext().createPattern(image, repetition || "");
                return this._addAction(["fillStyle", (this.fillStyle = pattern)]);
            };

            /**
             * ???????????????????????????
             */
            Graphics.prototype.beginPath = function () {
                return this._addAction(["beginPath"]);
            };

            /**
             * ????????????????????????
             */
            Graphics.prototype.closePath = function () {
                return this._addAction(["closePath"]);
            };

            /**
             * ?????????????????????
             */
            Graphics.prototype.drawRect = function (x, y, width, height) {
                return this._addAction(["rect", x, y, width, height]);
            };

            /**
             * ????????????????????????????????????
             */
            Graphics.prototype.drawRoundRectComplex = function (x, y, width, height, cornerTL, cornerTR, cornerBR, cornerBL) {
                this._addAction(["moveTo", x + cornerTL, y]);
                this._addAction(["lineTo", x + width - cornerTR, y]);
                this._addAction(["arc", x + width - cornerTR, y + cornerTR, cornerTR, -Math.PI / 2, 0, false]);
                this._addAction(["lineTo", x + width, y + height - cornerBR]);
                this._addAction(["arc", x + width - cornerBR, y + height - cornerBR, cornerBR, 0, Math.PI / 2, false]);
                this._addAction(["lineTo", x + cornerBL, y + height]);
                this._addAction(["arc", x + cornerBL, y + height - cornerBL, cornerBL, Math.PI / 2, Math.PI, false]);
                this._addAction(["lineTo", x, y + cornerTL]);
                this._addAction(["arc", x + cornerTL, y + cornerTL, cornerTL, Math.PI, Math.PI * 3 / 2, false]);
                return this;
            };

            /**
             * ???????????????????????????
             */
            Graphics.prototype.drawRoundRect = function (x, y, width, height, cornerSize) {
                return this.drawRoundRectComplex(x, y, width, height, cornerSize, cornerSize, cornerSize, cornerSize);
            };

            /**
             * ??????????????????
             */
            Graphics.prototype.drawCircle = function (x, y, radius) {
                return this._addAction(["arc", x + radius, y + radius, radius, 0, Math.PI * 2, 0]);
            };

            /**
             * ?????????????????????
             */
            Graphics.prototype.drawEllipse = function (x, y, width, height) {
                if (width == height) return this.drawCircle(x, y, width);

                var w = width / 2,
                    h = height / 2,
                    C = 0.5522847498307933,
                    cx = C * w,
                    cy = C * h;
                x = x + w;
                y = y + h;

                this._addAction(["moveTo", x + w, y]);
                this._addAction(["bezierCurveTo", x + w, y - cy, x + cx, y - h, x, y - h]);
                this._addAction(["bezierCurveTo", x - cx, y - h, x - w, y - cy, x - w, y]);
                this._addAction(["bezierCurveTo", x - w, y + cy, x - cx, y + h, x, y + h]);
                this._addAction(["bezierCurveTo", x + cx, y + h, x + w, y + cy, x + w, y]);
                return this;
            };

            /**
             * ?????????????????????SVG???????????????????????????
             * ????????????:
             * <p>var path = "M250 150 L150 350 L350 350 Z";</p>
             * <p>var shape = new Quark.Graphics({width:500, height:500});</p>
             * <p>shape.drawSVGPath(path).beginFill("#0ff").endFill();</p>
             */
            Graphics.prototype.drawSVGPath = function (pathData) {
                var path = pathData.split(/,| (?=[a-zA-Z])/);

                this._addAction(["beginPath"]);
                for (var i = 0, len = path.length; i < len; i++) {
                    var str = path[i],
                        cmd = str[0].toUpperCase(),
                        p = str.substring(1).split(/,| /);
                    if (p[0].length == 0) p.shift();

                    switch (cmd) {
                        case "M":
                            this._addAction(["moveTo", p[0], p[1]]);
                            break;
                        case "L":
                            this._addAction(["lineTo", p[0], p[1]]);
                            break;
                        case "C":
                            this._addAction(["bezierCurveTo", p[0], p[1], p[2], p[3], p[4], p[5]]);
                            break;
                        case "Z":
                            this._addAction(["closePath"]);
                            break;
                        default:
                            break;
                    }
                }
                return this;
            };

            /**
             * ????????????????????????????????????????????????
             * @private
             */
            Graphics.prototype._draw = function (context) {
                context.beginPath();
                for (var i = 0, len = this._actions.length; i < len; i++) {
                    var action = this._actions[i],
                        f = action[0],
                        args = action.length > 1 ? action.slice(1) : null;

                    if (typeof(context[f]) == "function") context[f].apply(context, args);
                    else context[f] = action[1];
                }
            };

            /**
             * Override method.
             * @private
             */
            Graphics.prototype.getDrawable = function (context) {
                //for DOMContext drawing only
                if (this.drawable == null) this.setDrawable(this.toImage());
                return this.drawable.get(this, context);
            };

            /**
             * ??????graphics?????????canvas???image?????????????????????????????????
             */
            Graphics.prototype.cache = function (toImage) {
                var canvas = Quark.createDOM("canvas", {
                    width: this.width,
                    height: this.height
                });
                this._draw(canvas.getContext("2d"));

                this._cache = canvas;
                if (toImage) this._cache = this.toImage();
                return this._cache;
            };

            /**
             * ???????????????
             */
            Graphics.prototype.uncache = function () {
                this._cache = null;
            };

            /**
             * ???Graphics???????????????dataURL??????????????????
             * @param {String} type ???????????????DataURL???????????????mime??????????????????"image/png"???
             */
            Graphics.prototype.toImage = function (type) {
                var cache = this._cache || this.cache(true);
                if (cache instanceof HTMLImageElement) return cache;

                var img = new Image();
                img.src = cache.toDataURL(type || "image/png");
                img.width = this.width;
                img.height = this.height;
                return img;
            };

            /**
             * ??????????????????????????????????????????????????????
             */
            Graphics.prototype.clear = function () {
                this._actions.length = 0;
                this._cache = null;

                this.lineWidth = 1;
                this.strokeStyle = "0";
                this.lineAlpha = 1;
                this.lineCap = null;
                this.lineJoin = null;
                this.miterLimit = 10;
                this.hasStroke = false;

                this.fillStyle = "0";
                this.fillAlpha = 1;
            };

            /**
             * ????????????????????????????????????????????????
             * @private
             */
            Graphics.prototype._addAction = function (action) {
                this._actions.push(action);
                return this;
            };

            /**
             * @private
             */
            Graphics._getContext = function () {
                var ctx = Quark.createDOM("canvas").getContext("2d");
                this._getContext = function () {
                    return ctx;
                };
                return ctx;
            };

        })();


        (function () {

            /**
             * ???????????????
             * @name Text
             * @augments DisplayObject
             * @class Text???????????????????????????????????????
             * @property text ?????????????????????????????????
             * @property font ??????????????????????????????
             * @property color ??????????????????????????????
             * @property textAlign ???????????????????????????????????????????????????????????????"start", "end", "left", "right", and "center"???
             * @property outline ??????????????????????????????????????????
             * @property maxWidth ??????????????????????????????????????????canvas????????????
             * @property lineWidth ?????????????????????????????????
             * @property lineSpacing ??????????????????????????????????????????
             * @property fontMetrics ?????????????????????????????????????????????????????????????????????????????????
             */
            var Text = Quark.Text = function (props) {
                this.text = "";
                this.font = "12px arial";
                this.color = "#000";
                this.textAlign = "start";
                this.outline = false;
                this.maxWidth = 10000;
                this.lineWidth = null;
                this.lineSpacing = 0;
                this.fontMetrics = null;

                props = props || {};
                Text.superClass.constructor.call(this, props);
                this.id = Quark.UIDUtil.createUID("Text");

                if (this.fontMetrics == null) this.fontMetrics = Text.getFontMetrics(this.font);
            }
            Quark.inherit(Text, Quark.DisplayObject);


            /**
             * ?????????????????????????????????????????????
             * @private
             */
            Text.prototype._draw = function (context) {
                if (!this.text || this.text.length == 0) return;

                //set drawing style
                context.font = this.font;
                context.textAlign = this.textAlign;
                context.textBaseline = "top";
                if (this.outline) context.strokeStyle = this.color;
                else context.fillStyle = this.color;

                //find and draw all explicit lines
                var lines = this.text.split(/\r\n|\r|\n|<br(?:[ \/])*>/);
                var y = 0,
                    lineHeight = this.fontMetrics.height + this.lineSpacing;
                this.width = this.lineWidth || 0;

                for (var i = 0, len = lines.length; i < len; i++) {
                    var line = lines[i],
                        width = context.measureText(line).width;

                    //check if the line need to split
                    if (this.lineWidth == null || width < this.lineWidth) {
                        if (width > this.width) this.width = width;
                        this._drawTextLine(context, line, y);
                        y += lineHeight;
                        continue;
                    }

                    //split the line by each single word, loop to find the break
                    //TODO: optimize the regular expression
                    var words = line.split(/([^\x00-\xff]|\b)/),
                        str = words[0];
                    for (var j = 1, wlen = words.length; j < wlen; j++) {
                        var word = words[j];
                        if (!word || word.length == 0) continue;

                        var newWidth = context.measureText(str + word).width;
                        if (newWidth > this.lineWidth) {
                            this._drawTextLine(context, str, y);
                            y += lineHeight;
                            str = word;
                        } else {
                            str += word;
                        }
                    }

                    //draw remaining string
                    this._drawTextLine(context, str, y);
                    y += lineHeight;
                }

                this.height = y;
            };

            /**
             * ???????????????????????????????????????????????????
             * @private
             */
            Text.prototype._drawTextLine = function (context, text, y) {
                var x = 0;
                switch (this.textAlign) {
                    case "center":
                        x = this.width * 0.5;
                        break;
                    case "right":
                    case "end":
                        x = this.width;
                        break;
                }
                ;
                if (this.outline) context.strokeText(text, x, y, this.maxWidth);
                else context.fillText(text, x, y, this.maxWidth);
            };

            /**
             * ????????????????????????????????????
             */
            Text.prototype.setFont = function (font, ignoreFontMetrics) {
                if (this.font == font) return;
                this.font = font;
                if (!ignoreFontMetrics) this.fontMetrics = Text.getFontMetrics(this.font);
            };

            /**
             * Overrideed.
             * @private
             */
            Text.prototype.render = function (context) {
                if (context instanceof Quark.DOMContext) {
                    var dom = this.getDrawable(context),
                        style = dom.style;
                    style.font = this.font;
                    style.textAlign = this.textAlign;
                    style.color = this.color;
                    //Notice: be care of width/height might be 0.
                    style.width = this.width + "px";
                    style.height = this.height + "px";
                    style.lineHeight = (this.fontMetrics.height + this.lineSpacing) + "px";
                    dom.innerHTML = this.text;
                }
                Text.superClass.render.call(this, context);
            };

            /**
             * Overrideed.
             * @private
             */
            Text.prototype.getDrawable = function (context) {
                //for DOMContext drawing only
                if (this.drawable == null) this.setDrawable(Quark.createDOM("div"), true);
                return this.drawable.get(this, context);
            };

            /**
             * ?????????????????????????????????????????????????????????????????????????????????
             * @method getFontMetrics
             * @return {Object} ????????????????????????????????????height???ascent???descent??????
             */
            Text.getFontMetrics = function (font) {
                var metrics = {};
                var elem = Quark.createDOM("div", {
                    style: {
                        font: font,
                        position: "absolute"
                    },
                    innerHTML: "M"
                });
                document.body.appendChild(elem);
                //the line height of the specific font style.
                metrics.height = elem.offsetHeight;

                //trick: calculate baseline shift by creating 1px height element that will be aligned to baseline.
                elem.innerHTML = '<div style="display:inline-block; width:1px; height:1px;"></div>';
                var baseline = elem.childNodes[0];
                //the ascent value is the length from the baseline to the top of the line height.
                metrics.ascent = baseline.offsetTop + baseline.offsetHeight;
                //the descent value is the length from the baseline to the bottom of the line height.
                metrics.descent = metrics.height - metrics.ascent;

                document.body.removeChild(elem);
                return metrics;
            };


        })();


    })();

    /*===================filePath:[src/main/motion/motion.js]======================*/
    /**
     * @author Brucewan
     * @version 1.0
     * @date 2014-06-13
     * @description tg????????????
     * @example
     var tab1 = new mo.Tab({
			target: $('#slide01 li')
		});
     * @name mo
     * @namespace
     */
    (function () {

        (function () {

            if (window.Motion) {
                return;
            }

            var Motion = /** @lends mo */{
                /**
                 * tg?????????
                 * @type {string}
                 */
                version: '1.1',

                /**
                 * ?????????????????? eg. Motion.add('mo.Slide:mo.Tab', function(){})
                 * @param {string} name
                 * @param {object} obj
                 */

                add: function (name, obj) {
                    var target = window;
                    var me = arguments.callee;
                    var parent = null;
                    var isMatch = /^([\w\.]+)(?:\:([\w\.]+))?\s*$/.test(name);
                    var objNS = RegExp.$1.split('.');
                    var parentNS = RegExp.$2.split('.');
                    var name = objNS.pop();
                    var isClass = /[A-Z]/.test(name.substr(0, 1));
                    var constructor = function () {
                        var mainFn = arguments.callee.prototype.init;
                        if (typeof(mainFn) == 'function' && arguments.callee.caller != me) {
                            mainFn && mainFn.apply(this, arguments);
                        }
                    };

                    for (var i = 0; i < objNS.length; i++) {
                        var p = objNS[i];
                        target = target[p] || (target[p] = {});
                    }

                    if (parentNS[0] != '') {
                        parent = window;
                        for (var i = 0; i < parentNS.length; i++) {
                            parent = parent[parentNS[i]];
                            if (!parent) {
                                parent = null;
                                break;
                            }
                        }
                    }


                    if (isClass && typeof(obj) == 'function') {
                        if (parent) {
                            constructor.prototype = new parent();
                            constructor.prototype.superClass = parent;
                        }
                        target[name] = constructor;
                        constructor.prototype.constructor = constructor;
                        obj.call(target[name].prototype);
                    } else {
                        target[name] = obj;
                    }

                }

            };

            window.Motion = window.mo = Motion;
        })();

    })();

    /*===================filePath:[src/main/base/base.js]======================*/
    /**
     * @version 1.0
     * @date 2014-06-15
     * @description mo
     * @name mo
     * @namespace
     */

    /**
     * @author Brucewan
     * @version 1.0
     * @date 2014-06-18
     * @description ?????????
     * @name mo.Base
     * @class
     */
    (function () {


        Motion.add('mo.Base', function () {
            /**
             * public ?????????
             * @alias mo.Base#
             * @ignore
             */
            var _public = this;
            /**
             * public static?????????
             * @alias mo.Base.
             * @ignore
             */
            var _static = this.constructor;
            /**
             * private static?????????
             * @alias mo.Base~
             * @ignore
             */
            var _self = {};
            /**
             * ????????????
             */
            _public.constructor = function () {
                // private?????????
                var _private = {};
            };


            /**
             * ????????????
             */

            _public.on = function (name, fn) {
                box = Zepto(this);
                return box.on.apply(box, arguments);
            };


            /**
             * ????????????
             */
            _public.off = function (name, fn) {
                box = Zepto(this);
                return box.off.apply(box, arguments);
            };

            /**
             * ????????????
             */
            _public.trigger = function (name, data) {
                var box = Zepto(this);
                return box.triggerHandler.apply(box, arguments);
            };


        });

    })();

    /*===================filePath:[src/main/image-editor/image-editor.js]======================*/
    /**
     * @author Brucewan
     * @version 1.0
     * @date 2014-07-11
     * @description ???????????????
     * @extends mo.Base
     * @name mo.ImageEditor
     * @requires zepto.js
     * @requires base.js
     * @param {zepto object} config.trigger ????????????????????????<input type="file" />
     * @param {zepto object} config.container ??????????????????
     * @param {number} [config.width=320] ???????????????
     * @param {number} [config.height=320] ???????????????
     * @param {object} config.iconScale ???????????? eg. {url: 'img/icon.png',rect: [300, 300, 25, 25]}
     * @param {object} config.iconClose ???????????? eg. {url: 'img/icon.png',rect: [300, 300, 25, 25]}
     * @see image-editor/demo1.html ???????????????????????????????????????????????????
     * @class
     */
    (function () {


        Motion.add('mo.ImageEditor:mo.Base', function () {

            /**
             * public ?????????
             * @alias mo.ImageEditor#
             * @ignore
             */
            var _public = this;

            var _private = {};

            /**
             * public static?????????
             * @alias mo.ImageEditor.
             * @ignore
             */
            var _static = this.constructor;


            // ??????????????????
            _static.config = {
                width: 320,
                height: 320,
                fps: 60
            };


            /***
             * ?????????
             * @description ????????????
             */
            _public.init = function (config) {
                this.config = Zepto.extend(true, {}, _static.config, config); // ????????????


                var self = this;
                var config = self.config;

                // ?????????????????????
                self.effect && self.on(self.effect);
                config.event && self.on(config.event);

                /**
                 * @event mo.ImageEditor#beforeinit
                 * @property {object} event ??????????????????
                 */
                if (self.trigger('beforeinit') === false) {
                    return;
                }

                // ??????canvas
                var canvas = Quark.createDOM('canvas', {
                    width: config.width,
                    height: config.height,
                    style: {
                        backgroundColor: "#fff"
                    }
                });
                canvas = $(canvas).appendTo(config.container)[0];


                var context = new Quark.CanvasContext({
                    canvas: canvas
                });

                /**
                 * ??????
                 * @name mo.ImageEditor#stage
                 * @type quark object
                 */
                self.stage = new Quark.Stage({
                    width: config.width,
                    height: config.height,
                    context: context
                });
                self.canvas = canvas;

                /**
                 * canvas context
                 * @name mo.ImageEditor#context
                 * @type  object
                 */
                self.context = context;

                // register stage events
                var em = this.em = new Quark.EventManager();
                em.registerStage(self.stage, ['touchstart', 'touchmove', 'touchend'], true, true);
                self.stage.stageX = config.stageX !== window.undefined ? config.stageX : self.stage.stageX;
                self.stage.stageY = config.stageY !== window.undefined ? config.stageY : self.stage.stageY;

                var timer = new Quark.Timer(1000 / config.fps);
                timer.addListener(self.stage);
                timer.addListener(Quark.Tween);
                timer.start();

                var bg = new Q.Graphics({
                    width: config.width,
                    height: config.height
                });
                bg.beginFill("#fff").drawRect(0, 0, config.width, config.height).endFill().cache();


                self.stage.addChild(bg);

                _private.attach.call(self);
            };


            _private.attach = function () {
                var self = this;
                var config = self.config;

                config.trigger.on('change', function (e) {

                    /**
                     * @event mo.ImageEditor#beforechange
                     * @property {object} event ??????????????????????????????
                     */
                    self.trigger('beforechange');

                    // ?????????????????????
                    var file = this.files[0];


                    // ????????????????????????
                    if (file.type && !/image\/\w+/.test(file.type)) {
                        alert('????????????????????????');
                        return false;
                    }

                    var fr = new FileReader();
                    fr.readAsDataURL(file);


                    fr.onload = function (fe) {
                        var result = this.result;
                        var img = new Image();
                        var exif;
                        img.onload = function () {
                            if (self.imgs && self.imgs.length > 0) {
                                for (var i = 0; i < self.imgs.length; i++) {
                                    var item = self.imgs[i];
                                    if (!item.disTop) {
                                        self.stage.removeChild(item);
                                        self.imgs.splice(i, 1);
                                    }
                                }
                            }

                            self.addImage({
                                img: img,
                                exif: exif,
                                disMove: true,
                                disScale: true,
                                disRotate: true
                            });

                            if (typeof config.fileComplete === 'function') {
                                config.fileComplete.call(null);
                            }

                            if (self.imgs && self.imgs.length > 0) {
                                for (var i = 0; i < self.imgs.length; i++) {
                                    var item = self.imgs[i];
                                    if (item.disTop) {
                                        self.stage.addChild(item);
                                    }
                                }
                            }

                            /**
                             * @event mo.ImageEditor#change
                             * @property {object} ?????????????????????
                             */
                            self.trigger('change');
                        };
                        // ?????????????????????
                        var base64 = result.replace(/^.*?,/, '');
                        var binary = atob(base64);
                        var binaryData = new BinaryFile(binary);

                        // get EXIF data
                        exif = EXIF.readFromBinaryFile(binaryData);

                        img.src = result;

                    };


                });


                self.stage.addEventListener('touchstart', function (e) {
                    if (self.imgs) {
                        for (var i = 0; i < self.imgs.length; i++) {
                            self.imgs[i].disable();
                        }
                    }
                    if (e.eventTarget && e.eventTarget.parent.enEditable) {
                        e.eventTarget.parent.enEditable();
                        self.activeTarget = e.eventTarget.parent;
                    }
                });
                self.stage.addEventListener('touchmove', function (e) {
                    /*
                     var touches = e.rawEvent.touches || e.rawEvent.changedTouches;
                     if (e.eventTarget && (e.eventTarget.parent == self.activeTarget) && touches[1]) {
                     var dis = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
                     if (self.activeTarget.mcScale.touchDis) {
                     var scale = dis / self.activeTarget.mcScale.touchDis - 1;
                     if (self.activeTarget.getCurrentWidth() < 100 && scale < 0) {
                     scale = 0;
                     }

                     self.activeTarget.scaleX += scale;
                     self.activeTarget.scaleY += scale;
                     }
                     self.activeTarget.mcScale.touchDis = dis;
                     }
                     */
                });
                self.stage.addEventListener('touchend', function (e) {
                    if (self.activeTarget && self.activeTarget.mcScale) {
                        delete self.activeTarget.mcScale.touchDis;
                    }
                });


            };

            /**
             * ????????????
             * @param {object} page eg.{img: document.querySelector('#img3'), disMove: true, disScale: true,disRotate:false, disTop:false,disY:0}
             */
            _public.addImage = function (info) {
                var self = this;
                var config = self.config;
                var img = info.img;
                var exif = info.exif;
                var imgContainer;
                var mcScale;
                var mcClose;
                var imgWidth = img.width;
                var imgHeight = img.height;
                var imgRotation = 0;
                var imgRegX = 0;
                var imgRegY = 0;
                var imgX = 0;
                var imgY = 0;
                var offsetX = (self.config.width - imgWidth) / 2;
                var offsetY = (self.config.height - imgHeight) / 2;
                var posX = offsetX < 0 ? 0 : offsetX;//??????X?????????
                var posY = info.disY ? (offsetY < 0 ? self.config.height / 2 : offsetY) : (offsetY < 0 ? 0 : offsetY);//??????Y?????????
                var imgScale = 1;
                var orientation = exif ? exif.Orientation : 1;
                var getRatio = function (img) {
                    if (/png$/i.test(img.src)) {
                        return 1;
                    }
                    var iw = img.naturalWidth,
                        ih = img.naturalHeight;
                    var canvas = document.createElement('canvas');
                    canvas.width = 1;
                    canvas.height = ih;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    var data = ctx.getImageData(0, 0, 1, ih).data;
                    var sy = 0;
                    var ey = ih;
                    var py = ih;
                    while (py > sy) {
                        var alpha = data[(py - 1) * 4 + 3];
                        if (alpha === 0) {
                            ey = py;
                        } else {
                            sy = py;
                        }
                        py = (ey + sy) >> 1;
                    }
                    var ratio = (py / ih);
                    return (ratio === 0) ? 1 : ratio;
                }
                var ratio = getRatio(img);


                // window.setTimeout(function(){
                // 	alert(imgContainer.width);
                // 	alert(img);
                // }, 5000)


                if (typeof img == 'string') {
                    var url = img;
                    img = new Image();
                    img.src = url;
                }


                // ????????????????????????????????????????????????
                switch (orientation) {
                    case 3:
                        imgRotation = 180;
                        imgRegX = imgWidth;
                        imgRegY = imgHeight * ratio;
                        // imgRegY -= imgWidth * (1-ratio);
                        break;
                    case 6:

                        imgRotation = 90;
                        imgWidth = img.height;
                        imgHeight = img.width;
                        imgRegY = imgWidth * ratio;
                        // imgRegY -= imgWidth * (1-ratio);
                        break;
                    case 8:
                        imgRotation = 270;
                        imgWidth = img.height;
                        imgHeight = img.width;
                        imgRegX = imgHeight * ratio;

                        if (/iphone|ipod|ipad/i.test(navigator.userAgent)) {
                            alert('????????????????????????????????????????????????????????????????????????');
                            return;
                        }

                        break;


                }
                imgWidth *= ratio;
                imgHeight *= ratio;


                if (imgWidth > self.stage.width) {
                    imgScale = self.stage.width / imgWidth;
                }

                imgWidth = imgWidth * imgScale;
                imgHeight = imgHeight * imgScale;

                imgContainer = new Quark.DisplayObjectContainer({
                    width: imgWidth,
                    height: imgHeight
                });
                imgContainer.x = posX;
                imgContainer.y = posY;


                img = new Quark.Bitmap({
                    image: img,
                    regX: imgRegX,
                    regY: imgRegY
                });
                img.rotation = imgRotation;
                img.x = imgX;
                img.y = 0;
                img.scaleX = imgScale * ratio;
                img.scaleY = imgScale;

                imgContainer.disTop = info.disTop ? true : false;//????????????

                // ??????????????????????????????????????????Scale??????
                /*
                 if (config.iconScale && !info.disScale) {
                 var iconScaleImg = new Image();
                 iconScaleImg.onload = function() {
                 var rect = config.iconScale.rect;
                 mcScale = new Quark.MovieClip({
                 image: iconScaleImg
                 });
                 mcScale.addFrame([{
                 rect: rect
                 }]);
                 mcScale.x = imgWidth - rect[2];
                 mcScale.y = 0;
                 mcScale.alpha = 0.5;
                 mcScale.visible = false;
                 mcScale.addEventListener('touchstart', function(e) {
                 mcScale.scaleable = true;
                 mcScale.startX = e.eventX;
                 mcScale.startY = e.eventY;
                 mcScale.alpha = 0.8;
                 var curW = imgContainer.getCurrentWidth();
                 var scaleMove = function(e) {
                 if (mcScale.scaleable) {
                 // ??????
                 var disX = e.eventX - mcScale.startX;
                 var scaleX = (curW + disX) / imgContainer.width;

                 if (imgContainer.getCurrentWidth() < 100 && imgContainer.scaleX > scaleX) {
                 return;
                 }

                 imgContainer.scaleX = scaleX;
                 imgContainer.scaleY = scaleX;

                 // ??????
                 var disOriX = e.eventX - imgContainer.x;
                 var disOriY = e.eventY - imgContainer.y;
                 var rotate = Math.atan2(disOriY, disOriX) * 360 / (2 * Math.PI);
                 imgContainer.rotation = parseInt(rotate / 1) * 1;
                 }
                 };
                 var scaleEnd = function(e) {
                 mcScale.scaleable = false;
                 mcScale.alpha = 0.5;
                 self.stage.removeEventListener('touchmove', scaleMove);
                 self.stage.removeEventListener('touchend', scaleEnd);
                 }
                 self.stage.addEventListener('touchmove', scaleMove);
                 self.stage.addEventListener('touchend', scaleEnd);
                 });
                 imgContainer.mcScale = mcScale;
                 imgContainer.addChild(mcScale);
                 };
                 iconScaleImg.src = config.iconScale.url;
                 }
                 */

                var border = new Q.Graphics({
                    width: imgWidth + 10,
                    height: imgHeight + 10,
                    x: -5,
                    y: -5
                });
                border.lineStyle(5, "#aaa").beginFill("#fff").drawRect(5, 5, imgWidth, imgHeight).endFill().cache();
                border.alpha = 0.5;
                border.visible = false;
                imgContainer.addChild(border);

                if (config.iconClose) {
                    var iconCloseImg = new Image();
                    iconCloseImg.onload = function () {
                        var rect = config.iconClose.rect;
                        mcClose = new Quark.MovieClip({
                            image: iconCloseImg
                        });
                        mcClose.addFrame([{
                            rect: rect
                        }]);
                        mcClose.x = 0;
                        mcClose.y = 0;
                        mcClose.alpha = 0.5;
                        mcClose.visible = false;
                        mcClose.addEventListener('touchstart', function (e) {
                            mcClose.alpha = 0.8;
                        });
                        mcClose.addEventListener('touchend', function (e) {
                            self.stage.removeChild(imgContainer);
                            var index = self.imgs.indexOf(imgContainer);
                            if (index !== -1) {
                                self.imgs.splice(index, 1);
                            }
                        });
                        self.stage.addEventListener('touchend', function (e) {
                            mcClose.alpha = 0.5;
                        });
                        imgContainer.addChild(mcClose);
                    };
                    iconCloseImg.src = config.iconClose.url;
                }


                if (!info.disable) {

                    img.fnStart = function (e) {
                        // console.log("MimgContainer:("+imgContainer.x+":"+imgContainer.y+")??????("+imgContainer.regX+":"+imgContainer.regY+") scale:"+imgContainer.scaleX);
                        // self.stage.addChild(imgContainer);//??????????????????
                        var isMultiTouch = e.rawEvent && e.rawEvent.touches[1];

                        if (!isMultiTouch) {
                            // ????????????
                            img.curW = imgContainer.getCurrentWidth();
                            img.curH = imgContainer.getCurrentHeight();
                            img.moveabled = true;
                            img.touchStart = [{
                                'x': e.eventX,
                                'y': e.eventY
                            }];
                            delete img.startScaleDistance;
                        } else {
                            // ????????????
                            var touch1 = e.rawEvent.touches[0];
                            var touch2 = e.rawEvent.touches[1];
                            img.startScaleDistance = Math.sqrt(Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2));
                            img.touchStart = [{
                                'x': touch1.pageX,
                                'y': touch1.pageY
                            },
                                {
                                    'x': touch2.pageX,
                                    'y': touch2.pageY
                                }];
                            // ???????????????????????????????????????fnMove?????????
                            img.touchStartScale = [{
                                'x': touch1.pageX,
                                'y': touch1.pageY
                            },
                                {
                                    'x': touch2.pageX,
                                    'y': touch2.pageY
                                }];
                            img.imgContainerStartRotation = imgContainer.rotation;

                            /* ??????????????????imgContainer???reg?????????????????????????????????????????????????????????????????????????????? start */

                            // 1.?????????????????????????????????????????????
                            var touches = img.touchStart;
                            var nCenterPoint = {'x': 0, 'y': 0};
                            for (var i = 0; i < touches.length; i++) {
                                nCenterPoint.x += touches[i].x
                                nCenterPoint.y += touches[i].y;
                            }
                            ;
                            nCenterPoint.x /= touches.length;
                            nCenterPoint.y /= touches.length;

                            // 2.?????????????????????canvas????????????
                            nCenterPoint.x -= self.canvas.offsetLeft;
                            nCenterPoint.y -= self.canvas.offsetTop;

                            // 3.????????????????????????canvas????????????
                            var leftUpPiont = {'x': 0, 'y': 0};
                            var dc = Math.sqrt(Math.pow(imgContainer.regX * imgContainer.scaleX, 2) + Math.pow(imgContainer.regY * imgContainer.scaleY, 2));
                            var r = Math.atan2(imgContainer.regY, imgContainer.regX);
                            r = 180 / Math.PI * r;
                            leftUpPiont.x = imgContainer.x - Math.cos(Math.PI * (imgContainer.rotation + r) / 180) * dc;
                            leftUpPiont.y = imgContainer.y - Math.sin(Math.PI * (imgContainer.rotation + r) / 180) * dc;

                            // 4.??????????????????????????????????????????
                            nCenterPoint.x -= leftUpPiont.x;
                            nCenterPoint.y -= leftUpPiont.y;

                            // ??????reg??????????????????????????????????????????????????????????????????????????????
                            var dc = Math.sqrt(Math.pow(nCenterPoint.x, 2) + Math.pow(nCenterPoint.y, 2));
                            var r = Math.atan2(nCenterPoint.y, nCenterPoint.x);
                            r = 180 / Math.PI * r;
                            var newRegX = dc * Math.cos(Math.PI * (r - imgContainer.rotation) / 180) / imgContainer.scaleX;
                            var newRegY = dc * Math.sin(Math.PI * (r - imgContainer.rotation) / 180) / imgContainer.scaleY;
                            //console.log("nc("+nCenterPoint.x+", "+nCenterPoint.y+") r:"+r+" ir:"+imgContainer.rotation);

                            // ??? imgContainer ??? regx ?????????????????????
                            var dx = newRegX - imgContainer.regX;
                            var dy = newRegY - imgContainer.regY;
                            imgContainer.regX += dx;
                            imgContainer.regY += dy;

                            // ??????????????????imgContainer???x???y??????????????????????????????
                            var dc = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                            var r = Math.atan2(dy, dx);
                            r = 180 / Math.PI * r;
                            imgContainer.x += dc * Math.cos(Math.PI * (imgContainer.rotation + r) / 180) * imgContainer.scaleX;
                            imgContainer.y += dc * Math.sin(Math.PI * (imgContainer.rotation + r) / 180) * imgContainer.scaleY;
                            //console.log("dx("+dx+", "+dy+")");

                            /* ??????????????????imgContainer???reg?????????????????????????????????????????????????????????????????????????????? end */

                        }
                    };

                    img.fnMove = function (e) {

                        // ??????????????????????????????
                        // 1.???????????????????????????
                        var touches = [];
                        // 2.????????????
                        var isMultiTouch = (img.touchStart && img.touchStart.length) > 1 ? true : false;

                        if (!isMultiTouch) {
                            touches = [{
                                'x': e.eventX,
                                'y': e.eventY
                            }];
                        } else {
                            touches = [{
                                'x': e.rawEvent.touches[0].pageX,
                                'y': e.rawEvent.touches[0].pageY
                            },
                                {
                                    'x': e.rawEvent.touches[1].pageX,
                                    'y': e.rawEvent.touches[1].pageY
                                }];
                        }

                        // ?????????????????????????????????????????????????????????????????????
                        // ??????????????????
                        if (!info.disScale && isMultiTouch) {

                            var dis = Math.sqrt(Math.pow(touches[1].x - touches[0].x, 2) + Math.pow(touches[1].y - touches[0].y, 2));
                            if (img.startScaleDistance) {
                                //console.log("s:"+img.startScaleDistance+"n:"+dis+"x:"+img.scaleX+"y:"+img.scaleY);
                                var newScale = dis * imgContainer.scaleX / img.startScaleDistance;
                                imgContainer.scaleX = newScale;
                                imgContainer.scaleY = newScale;

                            }
                            img.startScaleDistance = dis;
                        }

                        // ????????????
                        if (!info.disMove && img.moveabled) {
                            // ???????????????????????????????????????
                            var disX = 0, disY = 0;
                            for (var i = 0; i < touches.length; i++) {
                                disX += touches[i].x - img.touchStart[i].x;
                                disY += touches[i].y - img.touchStart[i].y;
                            }
                            ;
                            disX = disX / touches.length;
                            disY = disY / touches.length;


                            //	// ??????????????????
                            //	var setX = imgContainer.x + disX;
                            //	var setY = imgContainer.y + disY;

                            //
                            //	if (setX < -img.curW / 2 + 5 && disX < 0) {
                            //		setX = -img.curW / 2;
                            //	}
                            //	if (setY < -img.curH / 2 + 5 && disY < 0) {
                            //		setY = -img.curH / 2;
                            //	}
                            //	if (setX > -img.curW / 2 + self.stage.width - 5 && disX > 0) {
                            //		setX = self.stage.width - img.curW / 2;
                            //	}
                            //	if (setY > self.stage.height - 5 && disY > 0) {
                            //		setY = self.stage.height;
                            //	}

                            imgContainer.x += disX;
                            imgContainer.y += disY;

                            //console.log(disX+":"+disY);
                            //console.log(img.touchStart[0].x+":"+img.touchStart[0].y);
                            //console.log(touches[0].x+":"+touches[0].y);

                            img.touchStart = touches;
                        }


                        // ??????????????????
                        if (isMultiTouch && !info.disRotate) {

                            // 1.???????????????????????????
                            var dx = img.touchStartScale[1].x - img.touchStartScale[0].x;
                            var dy = img.touchStartScale[1].y - img.touchStartScale[0].y;
                            var r1 = Math.atan2(dy, dx);
                            r1 = 180 / Math.PI * r1;

                            // 2.???????????????????????????
                            var dx = touches[1].x - touches[0].x;
                            var dy = touches[1].y - touches[0].y;
                            var r2 = Math.atan2(dy, dx);
                            r2 = 180 / Math.PI * r2;

                            // 3.done!
                            imgContainer.rotation = img.imgContainerStartRotation + r2 - r1;
                            //console.log("r1:"+r1+" r2:"+r2);

                        }

                    };


                    img.fnEnd = function (e) {
                        img.moveabled = false;
                        /*
                         * ?????????????????????????????????????????????
                         * 1?????????????????????2??????????????????????????????touchend???????????????touchstart
                         * ??????touchend????????????????????????????????????????????????????????????????????????
                         */
                        var isMultiTouch = e.rawEvent && e.rawEvent.touches[1];

                        if (!isMultiTouch) {
                            // ????????????
                            img.curW = imgContainer.getCurrentWidth();
                            img.curH = imgContainer.getCurrentHeight();
                            img.moveabled = true;
                            img.touchStart = [{
                                'x': e.eventX,
                                'y': e.eventY
                            }];
                            delete img.startScaleDistance;
                        } else {
                            // ????????????
                            var touch1 = e.rawEvent.touches[0];
                            var touch2 = e.rawEvent.touches[1];
                            img.startScaleDistance = Math.sqrt(Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2));
                            img.touchStart = [{
                                'x': touch1.pageX,
                                'y': touch1.pageY
                            },
                                {
                                    'x': touch2.pageX,
                                    'y': touch2.pageY
                                }];

                        }

                    };

                    img.addEventListener('touchstart', function (e) {
                        // console.log("touchStart!");
                        img.fnStart(e);
                    });
                    img.addEventListener('touchmove', function (e) {
                        img.fnMove(e);
                    });
                    img.addEventListener('touchend', function (e) {
                        // console.log("touchEnd!");
                        img.fnEnd(e);

                    });


                }


                imgContainer.enEditable = function () {
                    if (info.disable) {
                        return;
                    }
                    border.visible = true;
                    /*
                     if (mcScale) {
                     mcScale.visible = true;
                     }
                     */
                    if (mcClose) {
                        mcClose.visible = true;
                    }
                }
                imgContainer.disable = function () {
                    border.visible = false;
                    /*
                     if (mcScale) {
                     mcScale.visible = false;
                     }
                     */
                    if (mcClose) {
                        mcClose.visible = false;
                    }
                }


                img.update = function () {
                    if (imgContainer && imgContainer.scaleX) {
                        /*
                         if (mcScale && mcScale.scaleX) {
                         mcScale.scaleX = 1 / imgContainer.scaleX;
                         mcScale.scaleY = 1 / imgContainer.scaleY;
                         mcScale.x = border.getCurrentWidth() - 10 - mcScale.getCurrentWidth();
                         }
                         */
                        if (mcClose && mcClose.scaleX) {
                            mcClose.scaleX = 1 / imgContainer.scaleX;
                            mcClose.scaleY = 1 / imgContainer.scaleY;
                            mcClose.x = 0;
                        }
                    }

                }


                // imgContainer.rotation = 10;

                imgContainer.addChild(img);


                self.stage.update = function () {
                    // console.log(0)
                    // img.rotation  ++;
                }

                imgContainer.update = function () {
                    //this.rotation  ++;
                }


                self.stage.addChild(imgContainer);


                /**
                 * ??????????????????
                 * @name mo.ImageEditor#imgs
                 * @type  array
                 */
                if (self.imgs) {
                    self.imgs.push(imgContainer);
                } else {
                    self.imgs = [imgContainer];
                }


                // self.imgContainer.addEventListener('touchend', function(){
                // 	alert('sss')
                // });

                return imgContainer;


            };

            /**
             * ????????????
             */
            _public.clear = function () {
                if (this.imgs) {
                    for (var i = 0; i < this.imgs.length; i++) {
                        this.stage.removeChild(this.imgs[i]);

                    }
                    this.imgs = [];
                }
            };

            /**
             * ??????????????????
             */
            _public.unSelect = function () {
                var imgs = this.imgs;
                if (imgs) {
                    for (var i = 0; i < imgs.length; i++) {
                        imgs[i].disable();
                    }
                }
            };

            /**
             * ??????base64??????
             */
            _public.toDataURL = function (callback) {
                var self = this;
                // ???????????????????????????
                self.unSelect();

                // ????????????QQ?????????canvas.toDataURL??????????????????jeegEncoder
                window.setTimeout(function () {
                    var encoder = new JPEGEncoder();
                    var data = encoder.encode(self.canvas.getContext('2d').getImageData(0, 0, self.stage.width, self.stage.height), 100);
                    callback.call(self, data);
                }, 1000 / self.config.fps)
            }

        });

    })();

})();