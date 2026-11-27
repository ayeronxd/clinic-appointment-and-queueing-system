const PSGC_BASE_URL = "https://psgc.gitlab.io/api";

/**
 * Fetch all regions.
 */
export async function getRegions() {
  const response = await fetch(`${PSGC_BASE_URL}/regions/`);
  const data = await response.json();
  return data.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch provinces for a given region code.
 */
export async function getProvinces(regionCode) {
  const response = await fetch(`${PSGC_BASE_URL}/regions/${regionCode}/provinces/`);
  const data = await response.json();
  return data.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch cities/municipalities for a given province code.
 */
export async function getCities(provinceCode) {
  const response = await fetch(
    `${PSGC_BASE_URL}/provinces/${provinceCode}/cities-municipalities/`
  );
  const data = await response.json();
  return data.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch barangays for a given city/municipality code.
 */
export async function getBarangays(cityCode) {
  const response = await fetch(
    `${PSGC_BASE_URL}/cities-municipalities/${cityCode}/barangays/`
  );
  const data = await response.json();
  return data.sort((a, b) => a.name.localeCompare(b.name));
}
