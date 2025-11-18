// eslint-disable-next-line import/no-anonymous-default-export
// eslint-disable-next-line no-restricted-globals

export default function MapWorker (args) {

var coloursJSON;
var MapModes;
var WhereSupportBlocksModes;
var ColourMethods;
var DitherMethods;
var canvasImageData;
var selectedBlocks;
var disabledTones;
var optionValue_modeNBTOrMapdat;
var optionValue_mapSize_x;
var optionValue_mapSize_y;
var optionValue_staircasing;
var optionValue_whereSupportBlocks;
var optionValue_transparency;
var optionValue_transparencyTolerance;
var optionValue_betterColour;
var optionValue_dithering;
var optionValue_dithering_propagation_red;
var optionValue_dithering_propagation_green;
var optionValue_dithering_propagation_blue;

var colourSetsToUse = []; // colourSetIds and shades to use in map
var exactColourCache = new Map(); // for mapping RGB that exactly matches in coloursJSON to colourSetId and tone
var colourCache = new Map(); // cache for reusing colours in identical pixels
var labCache = new Map();
var lab50Cache = new Map();
var lab65Cache = new Map();
var hctCache = new Map();

var maps = [];

/*
  'maps' is a matrix with entries accessable via maps[z][x], each of which corresponds to a 128x128 map. A typical entry is:
  { materials: {}, supportBlockCount: 128 }
  'materials' is a dictionary with keys corresponding to colourSetIds and entries being the number of blocks from this colourSet required to make the map.
*/

// rgb2lab conversion based on the one from redstonehelper's program
function rgb2lab(rgb) {
  let val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
  if (labCache.has(val)) return labCache.get(val);

  let r1 = rgb[0] / 255.0;
  let g1 = rgb[1] / 255.0;
  let b1 = rgb[2] / 255.0;

  r1 = 0.04045 >= r1 ? (r1 /= 12.0) : Math.pow((r1 + 0.055) / 1.055, 2.4);
  g1 = 0.04045 >= g1 ? (g1 /= 12.0) : Math.pow((g1 + 0.055) / 1.055, 2.4);
  b1 = 0.04045 >= b1 ? (b1 /= 12.0) : Math.pow((b1 + 0.055) / 1.055, 2.4);
  let f = (0.43605202 * r1 + 0.3850816 * g1 + 0.14308742 * b1) / 0.964221,
    h = 0.22249159 * r1 + 0.71688604 * g1 + 0.060621485 * b1,
    k = (0.013929122 * r1 + 0.097097 * g1 + 0.7141855 * b1) / 0.825211,
    l = 0.008856452 < h ? Math.pow(h, 1 / 3) : (903.2963 * h + 16.0) / 116.0,
    m = 500.0 * ((0.008856452 < f ? Math.pow(f, 1 / 3) : (903.2963 * f + 16.0) / 116.0) - l),
    n = 200.0 * (l - (0.008856452 < k ? Math.pow(k, 1 / 3) : (903.2963 * k + 16.0) / 116.0));

  rgb = [2.55 * (116.0 * l - 16.0) + 0.5, m + 0.5, n + 0.5];
  labCache.set(val, rgb);
  return rgb;
}

//Code based on culori.js - https://culorijs.org/

function labF(y) {
  return (0.00885645167903563081717167575546 < y ? Math.cbrt(y) : (903.2962962962962962962962962963 * y + 16) / 116);
}

function rgb2lab50(rgb) {
  let val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
  if (lab50Cache.has(val)) return lab50Cache.get(val);

  let r1 = rgb[0] / 255.0;
  let g1 = rgb[1] / 255.0;
  let b1 = rgb[2] / 255.0;

  let x = (0.436065742824811 * r1 + 0.3851514688337912 * g1 + 0.14307845442264197 * b1) / 0.96429567642956764295676429567643,
    y = 0.22249319175623702 * r1 + 0.7168870538238823 * g1 + 0.06061979053616537 * b1,
    z = (0.013923904500943465 * r1 + 0.09708128566574634 * g1 + 0.7140993584005155 * b1) / 0.82510460251046025104602510460251;
  let f1 = labF(y);

  let l = 116 * f1 - 16;
  let a = 0;
  let b = 0;

  if (r1 !== g1 || g1 !== b1) {
    let f0 = (0.00885645167903563081717167575546 < x ? Math.cbrt(x) : (903.2962962962962962962962962963 * x + 16) / 116);
    let f2 = (0.00885645167903563081717167575546 < z ? Math.cbrt(z) : (903.2962962962962962962962962963 * z + 16) / 116);
    a = 500 * (f0 - f1);
    b = 200 * (f1 - f2);
  }

  let lab50 = [l, a, b];
  lab50Cache.set(val, lab50);
  return lab50;
}

//Code based on culori.js - https://culorijs.org/
function rgb2lab65(rgb) {
  let val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
  if (lab65Cache.has(val)) return lab65Cache.get(val);

  let r1 = rgb[0] / 255.0;
  let g1 = rgb[1] / 255.0;
  let b1 = rgb[2] / 255.0;

  let x = (0.4123907992659593 * r1 + 0.357584339383878 * g1 + 0.1804807884018343 * b1) / 0.95045592705167173252279635258359,
    y = 0.2126390058715102 * r1 + 0.715168678767756 * g1 + 0.0721923153607337 * b1,
    z = (0.0193308187155918 * r1 + 0.119194779794626 * g1 + 0.9505321522496607 * b1) / 1.0890577507598784194528875379939;
  let f1 = labF(y);

  let l = 116 * f1 - 16;
  let a = 0;
  let b = 0;

  if (r1 !== g1 || g1 !== b1) {
    let f0 = (0.00885645167903563081717167575546 < x ? Math.cbrt(x) : (903.2962962962962962962962962963 * x + 16) / 116);
    let f2 = (0.00885645167903563081717167575546 < z ? Math.cbrt(z) : (903.2962962962962962962962962963 * z + 16) / 116);
    a = 500 * (f0 - f1);
    b = 200 * (f1 - f2);
  }

  let lab65 = [l, a, b];
  lab65Cache.set(val, lab65);
  return lab65;
}

//Code based on material-foundation - https://github.com/material-foundation/material-color-utilities
function linearized(channel) {
  const normalized = channel / 255.0;
  if (normalized <= 0.040449936) {
    return normalized / 12.92;
  } else {
    return Math.pow((normalized + 0.055) / 1.055, 2.4); //NOT multiplied by 100.0
  }
}

function signum(num) {
  if (num < 0) {
    return -1;
  } else if (num > 0) {
    return 1;
  } else {
    return 0;
  }
}

function rgb2xyz(rgb) {
  const r1 = linearized(rgb[0]);
  const g1 = linearized(rgb[1]);
  const b1 = linearized(rgb[2]);

  const x = 0.41233895 * r1 + 0.35762064 * g1 + 0.18051042 * b1;
  const y = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
  const z = 0.01932141 * r1 + 0.11916382 * g1 + 0.95034478 * b1;

  return [x, y, z]; // NOT multiplied by 100.0
}

function rgb2hct(rgb) {
  const val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
  if (hctCache.has(val)) return hctCache.get(val);

  const xyz = rgb2xyz(rgb);
  const x = xyz[0];
  const y = xyz[1];
  const z = xyz[2];

  const rD = (0.401288 * x + 0.650173 * y - 0.051461 * z) * 1.0211777027575200;
  const gD = (-0.250268 * x + 1.204414 * y + 0.045854 * z) * 0.98630772942801237;
  const bD = (-0.002079 * x + 0.048952 * y + 0.953127 * z) * 0.93396050828022992;

  const rAF = Math.pow((0.38848145378003529 * Math.abs(rD)) / 100.0, 0.42);
  const gAF = Math.pow((0.38848145378003529 * Math.abs(gD)) / 100.0, 0.42);
  const bAF = Math.pow((0.38848145378003529 * Math.abs(bD)) / 100.0, 0.42);

  const rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13);
  const gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13);
  const bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13);

  const a = (11.0 * rA + -12.0 * gA + bA) / 11.0;
  const b = (rA + gA - 2.0 * bA) / 9.0;
  const u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0;
  const p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0;

  const atan2 = Math.atan2(b, a);
  const atanDegrees = (atan2 * 180.0) / Math.PI;
  const hue = atanDegrees < 0 ? atanDegrees + 360.0 :
      atanDegrees >= 360 ? atanDegrees - 360.0 : atanDegrees;
  const hueRadians = (hue * Math.PI) / 180.0;

  const j = 100.0 * Math.pow(p2 * 0.03391879108791669, 1.3173270022537198);
  const huePrime = hue < 20.14 ? hue + 360 : hue;
  const p1 = 3911.227617099521 * 0.25 * (Math.cos((huePrime * Math.PI) / 180.0 + 2.0) + 3.8);
  const t = (p1 * Math.sqrt(a * a + b * b)) / (u + 0.305);
  const alpha = Math.pow(t, 0.9) * 0.8834525670408592;

  const m = alpha * Math.sqrt(j / 100.0) * 0.78948261793049368;
  const mstar = 43.859649122807014 * Math.log(1.0 + 0.0228 * m);

  const astar = mstar * Math.cos(hueRadians);
  const bstar = mstar * Math.sin(hueRadians);
  const Lstar = 116.0 * labF(y) - 16.0;

  const hct = [Lstar, astar, bstar];
  hctCache.set(val, hct);
  return hct;
}

function squaredEuclideanMetricColours(pixel1, pixel2) {
  const chosenColourMethod =
    ColourMethods[Object.keys(ColourMethods).find((colourMethodKey) => ColourMethods[colourMethodKey].uniqueId === optionValue_betterColour)];

  if (chosenColourMethod.uniqueId === ColourMethods.MapartCraftDefault.uniqueId) {
    //return deltaE(rgb2lab(pixel1),rgb2lab(pixel2))
    pixel1 = rgb2lab(pixel1);
    pixel2 = rgb2lab(pixel2);
    const L = pixel1[0] - pixel2[0];
    const a = pixel1[1] - pixel2[1];
    const b = pixel1[2] - pixel2[2];
    return L * L + a * a + b * b;
  }
  else if (chosenColourMethod.uniqueId === ColourMethods.Cie76_Lab50.uniqueId ||
    chosenColourMethod.uniqueId === ColourMethods.Cie76_Lab65.uniqueId ||
    chosenColourMethod.uniqueId === ColourMethods.Hct.uniqueId) {
    if (chosenColourMethod.uniqueId === ColourMethods.Cie76_Lab50.uniqueId) {
      pixel1 = rgb2lab50(pixel1);
      pixel2 = rgb2lab50(pixel2);
    }
    else if (chosenColourMethod.uniqueId === ColourMethods.Cie76_Lab65.uniqueId) {
      pixel1 = rgb2lab65(pixel1);
      pixel2 = rgb2lab65(pixel2);
    }
    else {
      pixel1 = rgb2hct(pixel1);
      pixel2 = rgb2hct(pixel2);
    }
    const L = pixel1[0] - pixel2[0];
    const a = pixel1[1] - pixel2[1];
    const b = pixel1[2] - pixel2[2];
    return L * L + a * a + b * b;
  }
  else if (chosenColourMethod.uniqueId === ColourMethods.Ciede2000_Lab50.uniqueId ||
      chosenColourMethod.uniqueId === ColourMethods.Ciede2000_Lab65.uniqueId) {
    //Code based on culori.js - https://culorijs.org/

    if (chosenColourMethod.uniqueId === ColourMethods.Ciede2000_Lab50.uniqueId) {
      pixel1 = rgb2lab50(pixel1);
      pixel2 = rgb2lab50(pixel2);
    }
    else {
      pixel1 = rgb2lab65(pixel1);
      pixel2 = rgb2lab65(pixel2);
    }

    let lStd = pixel1[0];
    let aStd = pixel1[1];
    let bStd = pixel1[2];
    let cStd = Math.sqrt(aStd * aStd + bStd * bStd);

    let lSmp = pixel2[0];
    let aSmp = pixel2[1];
    let bSmp = pixel2[2];
    let cSmp = Math.sqrt(aSmp * aSmp + bSmp * bSmp);
    let cAvg = (cStd + cSmp) / 2;

    let cAvgPow7 = Math.pow(cAvg, 7);
    let G =
      0.5 *
      (1 -
        Math.sqrt(
          cAvgPow7 / (cAvgPow7 + Math.pow(25, 7))
        ));

    let apStd = aStd * (1 + G);
    let apSmp = aSmp * (1 + G);

    let cpStd = Math.sqrt(apStd * apStd + bStd * bStd);
    let cpSmp = Math.sqrt(apSmp * apSmp + bSmp * bSmp);

    let hpStd =
      Math.abs(apStd) + Math.abs(bStd) === 0
        ? 0
        : Math.atan2(bStd, apStd);
    hpStd += (hpStd < 0) * 2 * Math.PI;

    let hpSmp =
      Math.abs(apSmp) + Math.abs(bSmp) === 0
        ? 0
        : Math.atan2(bSmp, apSmp);
    hpSmp += (hpSmp < 0) * 2 * Math.PI;

    let dL = lSmp - lStd;
    let dC = cpSmp - cpStd;

    let cpStdtimescpSmpZero = (cpStd === 0 && cpSmp === 0);
    let dhp = cpStdtimescpSmpZero ? 0 : hpSmp - hpStd;
    dhp -= (dhp > Math.PI) * 2 * Math.PI;
    dhp += (dhp < -Math.PI) * 2 * Math.PI;

    let dH = 2 * Math.sqrt(cpStd * cpSmp) * Math.sin(dhp / 2);

    let Lp = (lStd + lSmp) / 2;
    let Cp = (cpStd + cpSmp) / 2;

    let hp;
    if (cpStdtimescpSmpZero) {
      hp = hpStd + hpSmp;
    } else {
      hp = (hpStd + hpSmp) / 2;
      hp -= (Math.abs(hpStd - hpSmp) > Math.PI) * Math.PI;
      hp += (hp < 0) * 2 * Math.PI;
    }

    let Lpminus50 = Lp - 50;
    let Lpm50 = Lpminus50 * Lpminus50;
    let T =
      1 -
      0.17 * Math.cos(hp - Math.PI / 6) +
      0.24 * Math.cos(2 * hp) +
      0.32 * Math.cos(3 * hp + Math.PI / 30) -
      0.2 * Math.cos(4 * hp - (63 * Math.PI) / 180);

    let Sl = 1 + (0.015 * Lpm50) / Math.sqrt(20 + Lpm50);
    let Sc = 1 + 0.045 * Cp;
    let Sh = 1 + 0.015 * Cp * T;

    let deltaTheta =
      ((30 * Math.PI) / 180) *
      Math.exp(-1 * Math.pow(((180 / Math.PI) * hp - 275) / 25, 2));
    let Rc =
      2 *
      Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)));

    let Rt = -1 * Math.sin(2 * deltaTheta) * Rc;

    let dLdivSl = dL / Sl;
    let dCdivSc = dC / Sc;
    let dHdivSh = dH / Sh;
    return dLdivSl * dLdivSl + dCdivSc * dCdivSc + dHdivSh * dHdivSh +
        (((Rt * dC) / Sc) * dH) / Sh;
  }
  else {
    const r = pixel1[0] - pixel2[0];
    const g = pixel1[1] - pixel2[1];
    const b = pixel1[2] - pixel2[2];
    return r * r + g * g + b * b;
  }
}

function findClosestColourSetIdAndToneAndRGBTo(pixelRGB) {
  let RGBBinary = (pixelRGB[0] << 16) + (pixelRGB[1] << 8) + pixelRGB[2]; // injective mapping RGB to concatenated binaries
  if (colourCache.has(RGBBinary)) {
    return colourCache.get(RGBBinary);
  } else {
    let shortestDistance = 9999999;
    let closestPixel;

    colourSetsToUse.forEach((colourSet) => {
      Object.keys(colourSet.tonesRGB).forEach((toneKey) => {
        const toneRGB = colourSet.tonesRGB[toneKey];
        let squareDistance = squaredEuclideanMetricColours(toneRGB, pixelRGB);
        if (squareDistance < shortestDistance) {
          shortestDistance = squareDistance;
          closestPixel = {
            colourSetId: colourSet.colourSetId,
            tone: toneKey,
          };
        }
      });
    });
    colourCache.set(RGBBinary, closestPixel);
    return closestPixel;
  }
}

function findClosest2ColourSetIdAndToneAndRGBTo(pixelRGB) {
  let RGBBinary = (pixelRGB[0] << 16) + (pixelRGB[1] << 8) + pixelRGB[2];
  if (colourCache.has(RGBBinary)) {
    return colourCache.get(RGBBinary);
  } else {
    let shortestDistance1 = 9999999;
    let shortestDistance2 = 9999999;
    let closestPixel1 = { colourSetId: null, tone: null }; // best colour
    let closestPixel2 = { colourSetId: null, tone: null }; // second best colour

    colourSetsToUse.forEach((colourSet) => {
      Object.keys(colourSet.tonesRGB).forEach((toneKey) => {
        const toneRGB = colourSet.tonesRGB[toneKey];
        let squareDistance = squaredEuclideanMetricColours(toneRGB, pixelRGB);
        if (squareDistance < shortestDistance1) {
          shortestDistance1 = squareDistance;
          closestPixel1 = {
            colourSetId: colourSet.colourSetId,
            tone: toneKey,
          };
        }
        if (squareDistance < shortestDistance2 && colourSetIdAndToneToRGB(closestPixel1.colourSetId, closestPixel1.tone) !== toneRGB) {
          shortestDistance2 = squareDistance;
          closestPixel2 = {
            colourSetId: colourSet.colourSetId,
            tone: toneKey,
          };
        }
      });
    });
    if (
      shortestDistance2 !== 9999999 && // to make sure closestPixel2.colourSetId/tone is not null
      squaredEuclideanMetricColours(
        colourSetIdAndToneToRGB(closestPixel1.colourSetId, closestPixel1.tone),
        colourSetIdAndToneToRGB(closestPixel2.colourSetId, closestPixel2.tone)
      ) <= shortestDistance2
    ) {
      closestPixel2 = closestPixel1; // if closestPixel1 is a better fit to closestPixel2 than closestPixel2 is to the actual pixel
    }
    let newPixels = [shortestDistance1, shortestDistance2, closestPixel1, closestPixel2];
    colourCache.set(RGBBinary, newPixels);
    return newPixels;
  }
}

function setupColourSetsToUse() {
  let colourSetIdsToUse = []; // get selected colour sets
  Object.keys(selectedBlocks).forEach((key) => {
    if (selectedBlocks[key] !== "-1") {
      colourSetIdsToUse.push(key);
    }
  });

  // now get appropriate shades
  const toneKeys = Object.values(Object.values(MapModes).find((mapMode) => mapMode.uniqueId === optionValue_modeNBTOrMapdat).staircaseModes).find(
    (staircaseMode) => staircaseMode.uniqueId === optionValue_staircasing
  ).toneKeys;

  for (const colourSetId of colourSetIdsToUse) {
    let tonesRGB = {};
    for (const toneKey of toneKeys) {
      if (disabledTones[colourSetId].has(toneKey))
        continue;

      tonesRGB[toneKey] = coloursJSON[colourSetId].tonesRGB[toneKey];
    }

    if (Object.keys(tonesRGB).length === 0)
      continue;

    colourSetsToUse.push({
      colourSetId: colourSetId,
      tonesRGB: tonesRGB,
    });
  }
}

function setupExactColourCache() {
  // we do not care what staircasing option is selected etc as this does not matter
  // this is for exactly matching colours, whose values are never repeated in coloursJSON
  for (const [colourSetId, colourSet] of Object.entries(coloursJSON)) {
    for (const [toneKey, toneRGB] of Object.entries(colourSet.tonesRGB)) {
      const RGBBinary = (toneRGB[0] << 16) + (toneRGB[1] << 8) + toneRGB[2];
      exactColourCache.set(RGBBinary, {
        colourSetId: colourSetId,
        tone: toneKey,
      });
    }
  }
}

function exactRGBToColourSetIdAndTone(pixelRGB) {
  const RGBBinary = (pixelRGB[0] << 16) + (pixelRGB[1] << 8) + pixelRGB[2];
  return exactColourCache.get(RGBBinary);
}

function isSupportBlockMandatoryForColourSetIdAndTone(colourSetIdAndTone) {
  return coloursJSON[colourSetIdAndTone.colourSetId].blocks[selectedBlocks[colourSetIdAndTone.colourSetId]].supportBlockMandatory;
}

function colourSetIdAndToneToRGB(colourSetId, tone) {
  return coloursJSON[colourSetId]["tonesRGB"][tone];
}

function getMapartImageDataAndMaterials() {
  for (let y = 0; y < optionValue_mapSize_y; y++) {
    let mapsRowToAdd = [];
    for (let x = 0; x < optionValue_mapSize_x; x++) {
      let mapEntryToAdd = { materials: {}, supportBlockCount: 0 };
      colourSetsToUse.forEach((colourSet) => {
        mapEntryToAdd.materials[colourSet.colourSetId] = 0;
      });
      mapsRowToAdd.push(mapEntryToAdd);
    }
    maps.push(mapsRowToAdd);
  }

  if (colourSetsToUse.length === 0) {
    return;
  }

  if (optionValue_modeNBTOrMapdat === MapModes.SCHEMATIC_NBT.uniqueId) {
    maps.forEach((row) =>
      row.forEach((map) => {
        map.supportBlockCount = 128; // initialise with noobline count
      })
    );
  }

  let ditherMatrix;
  let divisor;
  const chosenDitherMethod =
    DitherMethods[Object.keys(DitherMethods).find((ditherMethodKey) => DitherMethods[ditherMethodKey].uniqueId === optionValue_dithering)];
  if (chosenDitherMethod.uniqueId !== DitherMethods.None.uniqueId) {
    ditherMatrix = chosenDitherMethod.ditherMatrix;
  }
  if (
    [
      DitherMethods.FloydSteinberg.uniqueId,
      DitherMethods.FloydSteinberg_20.uniqueId,
      DitherMethods.FloydSteinberg_24.uniqueId,
      DitherMethods.Atkinson.uniqueId,
      DitherMethods.Atkinson_6.uniqueId,
      DitherMethods.Atkinson_10.uniqueId,
      DitherMethods.Atkinson_12.uniqueId,
      DitherMethods.SierraFilterLite.uniqueId,
      DitherMethods.Fan.uniqueId,
      DitherMethods.ShiauFan.uniqueId,
      DitherMethods.ShiauFan2.uniqueId,
      DitherMethods.JarvisJudiceNinke.uniqueId,
      DitherMethods.Stucki.uniqueId,
      DitherMethods.Burkes.uniqueId,
      DitherMethods.Sierra.uniqueId,
      DitherMethods.SierraTworow.uniqueId,
    ].includes(chosenDitherMethod.uniqueId)
  ) {
    divisor = chosenDitherMethod.ditherDivisor;
  }
  for (let i = 0; i < canvasImageData.data.length; i += 4) {
    const indexR = i;
    const indexG = i + 1;
    const indexB = i + 2;
    const indexA = i + 3;

    const multimapWidth = optionValue_mapSize_x * 128;
    const multimap_x = (i / 4) % multimapWidth;
    const multimap_y = (i / 4 - multimap_x) / multimapWidth;
    const whichMap_x = Math.floor(multimap_x / 128);
    const whichMap_y = Math.floor(multimap_y / 128);
    const individualMap_y = multimap_y % 128;
    if (multimap_x === 0) {
      postMessage({
        head: "PROGRESS_REPORT",
        body: multimap_y / (128 * optionValue_mapSize_y),
      });
    }

    let closestColourSetIdAndTone;
    if (
      optionValue_modeNBTOrMapdat === MapModes.MAPDAT.uniqueId &&
      optionValue_transparency &&
      canvasImageData.data[indexA] < optionValue_transparencyTolerance
    ) {
      // we specially reserve 0,0,0,0 for transparent in mapdats
      canvasImageData.data[indexR] = 0;
      canvasImageData.data[indexG] = 0;
      canvasImageData.data[indexB] = 0;
      canvasImageData.data[indexA] = 0;
    } else {
      canvasImageData.data[indexA] = 255; // full opacity
      const oldPixel = [canvasImageData.data[indexR], canvasImageData.data[indexG], canvasImageData.data[indexB]];
      switch (chosenDitherMethod.uniqueId) {
        // Switch statement that checks the dither method every pixel;
        // I have tested a refactor that only checks once however the time difference is negligible and code quality deteriorates
        case DitherMethods.None.uniqueId: {
          closestColourSetIdAndTone = findClosestColourSetIdAndToneAndRGBTo(oldPixel);
          const closestColour = colourSetIdAndToneToRGB(closestColourSetIdAndTone.colourSetId, closestColourSetIdAndTone.tone);
          canvasImageData.data[indexR] = closestColour[0];
          canvasImageData.data[indexG] = closestColour[1];
          canvasImageData.data[indexB] = closestColour[2];
          break;
        }
        case DitherMethods.Bayer22.uniqueId:
        case DitherMethods.Bayer33.uniqueId:
        case DitherMethods.Bayer44.uniqueId:
        case DitherMethods.Bayer88.uniqueId:
        case DitherMethods.Ordered33.uniqueId:
        case DitherMethods.ClusterDot44.uniqueId:
        case DitherMethods.Halftone88.uniqueId:
        case DitherMethods.VoidAndCluster1414.uniqueId: {
          const newPixels = findClosest2ColourSetIdAndToneAndRGBTo(oldPixel);
          // newPixels = [shortestDistance1, shortestDistance2, newPixel1, newPixel2]
          if (
            (newPixels[0] * (ditherMatrix[0].length * ditherMatrix.length + 1)) / newPixels[1] >
            ditherMatrix[multimap_x % ditherMatrix[0].length][multimap_y % ditherMatrix.length]
          ) {
            closestColourSetIdAndTone = newPixels[3];
          } else {
            closestColourSetIdAndTone = newPixels[2];
          }
          const closestColour = colourSetIdAndToneToRGB(closestColourSetIdAndTone.colourSetId, closestColourSetIdAndTone.tone);
          canvasImageData.data[indexR] = closestColour[0];
          canvasImageData.data[indexG] = closestColour[1];
          canvasImageData.data[indexB] = closestColour[2];
          break;
        }
        //Error diffusion algorithms
        case DitherMethods.FloydSteinberg.uniqueId:
        case DitherMethods.FloydSteinberg_20.uniqueId:
        case DitherMethods.FloydSteinberg_24.uniqueId:
        case DitherMethods.Atkinson.uniqueId:
        case DitherMethods.Atkinson_6.uniqueId:
        case DitherMethods.Atkinson_10.uniqueId:
        case DitherMethods.Atkinson_12.uniqueId:
        case DitherMethods.SierraFilterLite.uniqueId:
        case DitherMethods.Fan.uniqueId:
        case DitherMethods.ShiauFan.uniqueId:
        case DitherMethods.ShiauFan2.uniqueId:
        case DitherMethods.JarvisJudiceNinke.uniqueId:
        case DitherMethods.Stucki.uniqueId:
        case DitherMethods.Burkes.uniqueId:
        case DitherMethods.Sierra.uniqueId:
        case DitherMethods.SierraTworow.uniqueId:
        {
          closestColourSetIdAndTone = findClosestColourSetIdAndToneAndRGBTo(oldPixel);
          const closestColour = colourSetIdAndToneToRGB(closestColourSetIdAndTone.colourSetId, closestColourSetIdAndTone.tone);
          canvasImageData.data[indexR] = closestColour[0];
          canvasImageData.data[indexG] = closestColour[1];
          canvasImageData.data[indexB] = closestColour[2];

          const quant_error = [
            (oldPixel[0] - closestColour[0]) * optionValue_dithering_propagation_red / 100.0,
            (oldPixel[1] - closestColour[1]) * optionValue_dithering_propagation_green / 100.0,
            (oldPixel[2] - closestColour[2]) * optionValue_dithering_propagation_blue / 100.0
          ];

          try {
            // ditherMatrix [0][0...2] should always be zero, and can thus be skipped
            if (multimap_x + 1 < multimapWidth) {
              // Make sure to not carry over error from one side to the other
              const weight = ditherMatrix[0][3] / divisor; // 1 right
              canvasImageData.data[i + 4] += quant_error[0] * weight;
              canvasImageData.data[i + 5] += quant_error[1] * weight;
              canvasImageData.data[i + 6] += quant_error[2] * weight;
              if (multimap_x + 2 < multimapWidth) {
                const weight = ditherMatrix[0][4] / divisor; // 2 right
                canvasImageData.data[i + 8] += quant_error[0] * weight;
                canvasImageData.data[i + 9] += quant_error[1] * weight;
                canvasImageData.data[i + 10] += quant_error[2] * weight;
              }
            }

            // First row below
            if (multimap_x > 0) {
              // Order reversed, to allow nesting of 'if' blocks
              const weight = ditherMatrix[1][1] / divisor; // 1 down, 1 left
              canvasImageData.data[i + multimapWidth * 4 - 4] += quant_error[0] * weight;
              canvasImageData.data[i + multimapWidth * 4 - 3] += quant_error[1] * weight;
              canvasImageData.data[i + multimapWidth * 4 - 2] += quant_error[2] * weight;
              if (multimap_x > 1) {
                const weight = ditherMatrix[1][0] / divisor; // 1 down, 2 left
                canvasImageData.data[i + multimapWidth * 4 - 8] += quant_error[0] * weight;
                canvasImageData.data[i + multimapWidth * 4 - 7] += quant_error[1] * weight;
                canvasImageData.data[i + multimapWidth * 4 - 6] += quant_error[2] * weight;
              }
            }
            let weight = ditherMatrix[1][2] / divisor; // 1 down
            canvasImageData.data[i + multimapWidth * 4 + 0] += quant_error[0] * weight;
            canvasImageData.data[i + multimapWidth * 4 + 1] += quant_error[1] * weight;
            canvasImageData.data[i + multimapWidth * 4 + 2] += quant_error[2] * weight;
            if (multimap_x + 1 < multimapWidth) {
              const weight = ditherMatrix[1][3] / divisor; // 1 down, 1 right
              canvasImageData.data[i + multimapWidth * 4 + 4] += quant_error[0] * weight;
              canvasImageData.data[i + multimapWidth * 4 + 5] += quant_error[1] * weight;
              canvasImageData.data[i + multimapWidth * 4 + 6] += quant_error[2] * weight;
              if (multimap_x + 2 < multimapWidth) {
                const weight = ditherMatrix[1][4] / divisor; // 1 down, 2 right
                canvasImageData.data[i + multimapWidth * 4 + 8] += quant_error[0] * weight;
                canvasImageData.data[i + multimapWidth * 4 + 9] += quant_error[1] * weight;
                canvasImageData.data[i + multimapWidth * 4 + 10] += quant_error[2] * weight;
              }
            }

            // Second row below
            if (multimap_x > 0) {
              const weight = ditherMatrix[2][1] / divisor; // 2 down, 1 left
              canvasImageData.data[i + multimapWidth * 8 - 4] += quant_error[0] * weight;
              canvasImageData.data[i + multimapWidth * 8 - 3] += quant_error[1] * weight;
              canvasImageData.data[i + multimapWidth * 8 - 2] += quant_error[2] * weight;
              if (multimap_x > 1) {
                const weight = ditherMatrix[2][0] / divisor; // 2 down, 2 left
                canvasImageData.data[i + multimapWidth * 8 - 8] += quant_error[0] * weight;
                canvasImageData.data[i + multimapWidth * 8 - 7] += quant_error[1] * weight;
                canvasImageData.data[i + multimapWidth * 8 - 6] += quant_error[2] * weight;
              }
            }
            weight = ditherMatrix[2][2] / divisor; // 2 down
            canvasImageData.data[i + multimapWidth * 8 + 0] += quant_error[0] * weight;
            canvasImageData.data[i + multimapWidth * 8 + 1] += quant_error[1] * weight;
            canvasImageData.data[i + multimapWidth * 8 + 2] += quant_error[2] * weight;
            if (multimap_x + 1 < multimapWidth) {
              const weight = ditherMatrix[2][3] / divisor; // 2 down, 1 right
              canvasImageData.data[i + multimapWidth * 8 + 4] += quant_error[0] * weight;
              canvasImageData.data[i + multimapWidth * 8 + 5] += quant_error[1] * weight;
              canvasImageData.data[i + multimapWidth * 8 + 6] += quant_error[2] * weight;
              if (multimap_x + 2 < multimapWidth) {
                const weight = ditherMatrix[2][4] / divisor; // 2 down, 2 right
                canvasImageData.data[i + multimapWidth * 8 + 8] += quant_error[0] * weight;
                canvasImageData.data[i + multimapWidth * 8 + 9] += quant_error[1] * weight;
                canvasImageData.data[i + multimapWidth * 8 + 10] += quant_error[2] * weight;
              }
            }
          } catch (e) {
            console.log(e); // ???
          }
          break;
        }
        default:
          break;
      }

      // support-block count: mapdat can skip this
      if (optionValue_modeNBTOrMapdat === MapModes.SCHEMATIC_NBT.uniqueId) {
        switch (optionValue_whereSupportBlocks) {
          case WhereSupportBlocksModes.NONE.uniqueId: {
            break;
          }
          case WhereSupportBlocksModes.IMPORTANT.uniqueId: {
            if (isSupportBlockMandatoryForColourSetIdAndTone(closestColourSetIdAndTone)) {
              maps[whichMap_y][whichMap_x].supportBlockCount += 1;
            }
            break;
          }
          case WhereSupportBlocksModes.ALL_OPTIMIZED.uniqueId: {
            // for AllOptimized and AllDoubleOptimized we need to know the block south's y-position / does it need support to be able to determine
            // whether a block needs support underneath; hence we do add support blocks '1-cycle behind' in the for-loop
            switch (individualMap_y) {
              case 0: {
                // we now know about the first block in the column which allows us to determine noobline support blocks
                if (
                  // first under-support block
                  closestColourSetIdAndTone.tone === "dark" ||
                  (closestColourSetIdAndTone.tone === "normal" && isSupportBlockMandatoryForColourSetIdAndTone(closestColourSetIdAndTone))
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                if (
                  // second under-support block
                  closestColourSetIdAndTone.tone === "dark" &&
                  isSupportBlockMandatoryForColourSetIdAndTone(closestColourSetIdAndTone)
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                break;
              }
              case 1: {
                // first block in column; special since noobline to the North
                const coloursBlock0_index = i - 4 * 128 * optionValue_mapSize_x; //exactRGBToColourSetIdAndTone
                const coloursBlock0 = exactRGBToColourSetIdAndTone([
                  canvasImageData.data[coloursBlock0_index],
                  canvasImageData.data[coloursBlock0_index + 1],
                  canvasImageData.data[coloursBlock0_index + 2],
                ]);
                if (
                  // first under-support block
                  coloursBlock0.tone === "light" ||
                  closestColourSetIdAndTone.tone === "dark" ||
                  (closestColourSetIdAndTone.tone === "normal" && isSupportBlockMandatoryForColourSetIdAndTone(closestColourSetIdAndTone)) ||
                  isSupportBlockMandatoryForColourSetIdAndTone(coloursBlock0)
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                if (
                  // second under-support block
                  closestColourSetIdAndTone.tone === "dark" &&
                  isSupportBlockMandatoryForColourSetIdAndTone(closestColourSetIdAndTone)
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                break;
              }
              case 127: {
                // falls through
                // special case 127 also accounts for final block in column since we are 1-cycle behind in out for-loop; no lookahead.
                // falls through to default case to also account for block 126 as expected too
                const penultimateColoursBlock_index = i - 4 * 128 * optionValue_mapSize_x;
                const penultimateColoursBlock = exactRGBToColourSetIdAndTone([
                  canvasImageData.data[penultimateColoursBlock_index],
                  canvasImageData.data[penultimateColoursBlock_index + 1],
                  canvasImageData.data[penultimateColoursBlock_index + 2],
                ]);
                if (
                  // first under-support block
                  closestColourSetIdAndTone.tone === "light" ||
                  isSupportBlockMandatoryForColourSetIdAndTone(closestColourSetIdAndTone) ||
                  (closestColourSetIdAndTone.tone === "normal" && isSupportBlockMandatoryForColourSetIdAndTone(penultimateColoursBlock))
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                if (
                  // second under-support block
                  closestColourSetIdAndTone.tone === "light" &&
                  isSupportBlockMandatoryForColourSetIdAndTone(penultimateColoursBlock)
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
              }
              // eslint-disable-next-line no-fallthrough
              default: {
                // average block in column
                const coloursBlock_north_index = i - 4 * 128 * optionValue_mapSize_x * 2;
                const coloursBlock_north = exactRGBToColourSetIdAndTone([
                  canvasImageData.data[coloursBlock_north_index],
                  canvasImageData.data[coloursBlock_north_index + 1],
                  canvasImageData.data[coloursBlock_north_index + 2],
                ]);
                const coloursBlock_index = i - 4 * 128 * optionValue_mapSize_x;
                const coloursBlock = exactRGBToColourSetIdAndTone([
                  canvasImageData.data[coloursBlock_index],
                  canvasImageData.data[coloursBlock_index + 1],
                  canvasImageData.data[coloursBlock_index + 2],
                ]);
                const coloursBlock_south = closestColourSetIdAndTone;
                if (
                  // first under-support block
                  coloursBlock.tone === "light" ||
                  coloursBlock_south.tone === "dark" ||
                  (coloursBlock_south.tone === "normal" && isSupportBlockMandatoryForColourSetIdAndTone(coloursBlock_south)) ||
                  isSupportBlockMandatoryForColourSetIdAndTone(coloursBlock) ||
                  (coloursBlock.tone === "normal" && isSupportBlockMandatoryForColourSetIdAndTone(coloursBlock_north))
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                if (
                  // second under-support block
                  (coloursBlock_south.tone === "dark" && isSupportBlockMandatoryForColourSetIdAndTone(coloursBlock_south)) ||
                  (coloursBlock.tone === "light" && isSupportBlockMandatoryForColourSetIdAndTone(coloursBlock_north))
                ) {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                break;
              }
            }
            break;
          }
          case WhereSupportBlocksModes.ALL_DOUBLE_OPTIMIZED.uniqueId: {
            switch (individualMap_y) {
              case 0: {
                // noobline
                maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                if (closestColourSetIdAndTone.tone === "dark") {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                break;
              }
              case 127: {
                // falls through
                maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                if (closestColourSetIdAndTone.tone === "light") {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
              }
              // eslint-disable-next-line no-fallthrough
              default: {
                maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                const coloursBlock_north_index = i - 4 * 128 * optionValue_mapSize_x;
                const coloursBlock_north = exactRGBToColourSetIdAndTone([
                  canvasImageData.data[coloursBlock_north_index],
                  canvasImageData.data[coloursBlock_north_index + 1],
                  canvasImageData.data[coloursBlock_north_index + 2],
                ]);
                if (coloursBlock_north.tone === "light" || closestColourSetIdAndTone.tone === "dark") {
                  maps[whichMap_y][whichMap_x].supportBlockCount += 1;
                }
                break;
              }
            }
            break;
          }
          default: {
            break;
          }
        }
        maps[whichMap_y][whichMap_x].materials[closestColourSetIdAndTone.colourSetId] += 1;
      }
    }
  }
}

onmessage = (e) => {
  coloursJSON = e.data.body.coloursJSON;
  MapModes = e.data.body.MapModes;
  WhereSupportBlocksModes = e.data.body.WhereSupportBlocksModes;
  ColourMethods = e.data.body.ColourMethods;
  DitherMethods = e.data.body.DitherMethods;
  canvasImageData = e.data.body.canvasImageData;
  selectedBlocks = e.data.body.selectedBlocks;
  disabledTones = e.data.body.disabledTones;
  optionValue_modeNBTOrMapdat = e.data.body.optionValue_modeNBTOrMapdat;
  optionValue_mapSize_x = e.data.body.optionValue_mapSize_x;
  optionValue_mapSize_y = e.data.body.optionValue_mapSize_y;
  optionValue_staircasing = e.data.body.optionValue_staircasing;
  optionValue_whereSupportBlocks = e.data.body.optionValue_whereSupportBlocks;
  optionValue_transparency = e.data.body.optionValue_transparency;
  optionValue_transparencyTolerance = e.data.body.optionValue_transparencyTolerance;
  optionValue_betterColour = e.data.body.optionValue_betterColour;
  optionValue_dithering = e.data.body.optionValue_dithering;
  optionValue_dithering_propagation_red = e.data.body.optionValue_dithering_propagation_red;
  optionValue_dithering_propagation_green = e.data.body.optionValue_dithering_propagation_green;
  optionValue_dithering_propagation_blue = e.data.body.optionValue_dithering_propagation_blue;

  setupColourSetsToUse();
  setupExactColourCache();
  getMapartImageDataAndMaterials();
  postMessage({
    head: "PIXELS_MATERIALS_CURRENTSELECTEDBLOCKS",
    body: {
      pixels: canvasImageData,
      maps: maps,
      currentSelectedBlocks: selectedBlocks,
    },
  });
};

};
