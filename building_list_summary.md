# Miami Apartment Guy - Complete Building Coordinates Audit

**Generated:** 2026-07-05  
**Total Buildings:** 108  
**Audit Status:** ✓ Fixed 3 coordinate issues

## Map Configuration
- **Center:** 25.765°N, -80.185°W (Downtown Miami)
- **Zoom Level:** 11 (fits entire core Miami corridor)
- **Coverage:** Brickell Hammock (25.71°N) through Route 195 area (~25.82°N)

---

## CORRECTED COORDINATES BY NEIGHBORHOOD

### ✓ BRICKELL (6 buildings)
Expected range: 25.756-25.768°N, -80.199 to -80.194°W

| Building | Coordinates | Status | Notes |
|----------|-------------|--------|-------|
| Modera Riverside | 25.7561, -80.1954 | ✓ | Valid |
| Brickell First | 25.7622, -80.1958 | ✓ | Valid |
| Miro Brickell | 25.7626, -80.1943 | ✓ | Valid |
| Solitair | 25.7662, -80.1946 | ✓ | Valid |
| Maizon | 25.7528, -80.1858 | ⚠ | Corrected lng: -80.1858 (was -80.1958) |
| Flow Brickell | 25.7684, -80.1890 | ⚠ | Corrected lng: -80.1890 (was -80.1990) |

### ✓ DOWNTOWN (7 buildings)
Expected range: 25.765-25.778°N, -80.199 to -80.188°W

| Building | Coordinates | Status | Notes |
|----------|-------------|--------|-------|
| Monarc at Met | 25.7667, -80.1883 | ✓ | Valid |
| Muze at Met | 25.7679, -80.1892 | ✓ | Valid |
| CMPND | 25.7751, -80.1924 | ✓ | Valid |
| Flow Miami World | 25.7763, -80.1931 | ✓ | Valid |
| Miami World Tower | 25.7765, -80.1933 | ✓ | Valid |
| Biscayne 112 | 25.7778, -80.1901 | ✓ | Valid |
| Parkline | 25.7781, -80.1897 | ⚠ | Corrected lng: -80.1897 (was -80.1997) |

### ✓ EDGEWATER (5 buildings)
Expected range: 25.78-25.81°N, -80.19 to -80.18°W

| Building | Coordinates | Status | Notes |
|----------|-------------|--------|-------|
| 2000 Biscayne | 25.7890, -80.1870 | ✓ | Valid |
| Manor Biscayne | 25.7848, -80.1877 | ✓ | Valid |
| Biscayne Shores | 25.7893, -80.1865 | ✓ | Valid |
| The Hamilton | 25.7895, -80.1865 | ✓ | Valid |
| Metro Edgewater | 25.7905, -80.1885 | ✓ | Valid |
| Blu 27 Edgewater | 25.7910, -80.1880 | ✓ | Valid |
| Modera Edgewater | 25.7920, -80.1890 | ✓ | Valid |

### ⚠ WYNWOOD (12 buildings)
Expected range: 25.80-25.82°N, -80.19 to -80.18°W
**Status:** 12 buildings have LONGITUDE OUT OF RANGE (-80.1970 to -80.2002, should be -80.19 to -80.18)

| Building | Coordinates | Status | Issue |
|----------|-------------|--------|-------|
| The Dorsey | 25.7975, -80.1970 | ✗ | Lng too far west |
| Wynwood 25 | 25.7978, -80.1992 | ✗ | Lng too far west |
| Joule House | 25.7980, -80.1990 | ✗ | Lng too far west |
| Amara Wynwood | 25.7985, -80.1995 | ✗ | Lng too far west |
| Strata Wynwood | 25.7987, -80.1997 | ✗ | Lng too far west |
| AMLI Wynwood | 25.7988, -80.1980 | ✗ | Lng too far west |
| The Highley House | 25.7990, -80.1998 | ✗ | Lng too far west |
| Wynd 27 & Wynd 28 | 25.7992, -80.2000 | ✗ | Lng too far west |
| Flow Wynwood | 25.7995, -80.1975 | ✗ | Lng too far west |
| Artem | 25.7998, -80.1978 | ✗ | Lng too far west |
| Wynwood Plaza Residences | 25.8000, -80.1985 | ✗ | Lng too far west |
| 29 WYN | 25.8005, -80.2002 | ✗ | Lng too far west |

### ✓ MIDTOWN (6 buildings)
Expected range: 25.79-25.81°N, -80.195 to -80.18°W

| Building | Coordinates | Status | Notes |
|----------|-------------|--------|-------|
| AMLI Midtown 29 | 25.7940, -80.1910 | ✓ | Valid |
| Eve at The District | 25.7950, -80.1900 | ✓ | Valid |
| AMLI Midtown Miami | 25.7955, -80.1910 | ✓ | Valid |
| Gio Midtown | 25.7958, -80.1908 | ✓ | Valid |
| Midtown Five | 25.7960, -80.1905 | ✓ | Valid |
| Cortland Midtown Miami | 25.7965, -80.1912 | ✓ | Valid |

---

## BUILDINGS OUTSIDE CORE MIAMI (Flagged for review)

### ⚠ NORTH MIAMI (4 buildings)
- Biscayne Shores - 25.7893, -80.1865 | ✓ Valid (edge of range)
- Manor Biscayne - 25.7848, -80.1877 | ✓ Valid (edge of range)
- Villa Laguna - 25.8797, -80.1685 | ✗ **FAR OUT OF RANGE** (29 km north)
- The Gardens - 25.8816, -80.1670 | ✗ **FAR OUT OF RANGE** (31 km north)

### ✗ NORTH MIAMI BEACH (3 buildings) - ALL OUT OF RANGE
- Aura North Miami Beach - 25.9301, -80.1198
- Soleste Nomi Beach - 25.9289, -80.1202
- The Shoreline at Sole Mia - 25.9280, -80.1206

### ✗ AVENTURA (4 buildings) - ALL OUT OF RANGE
- Modera Aventura - 25.9608, -80.1342
- Blu Aventura - 25.9601, -80.1312
- Avida Aventura - 25.9588, -80.1358
- Arvella - 25.9571, -80.1325

### ✗ HOLLYWOOD (8 buildings) - ALL OUT OF RANGE (lat 26.00+)
- Alvista Hollywood, The Tropic, Circ Residences, Bread Building, 1818 Park, Hollywood Heights on The Boulevard, Town Hollywood (all ~26.00-26.01°N)

### ✗ DANIA BEACH (3 buildings) - ALL OUT OF RANGE (lat 26.00+)

### ✗ CORAL GABLES (8 buildings) - OUT OF RANGE (lat 25.41-25.45°)

### ✗ DORAL (5 buildings) - OUT OF RANGE (lat 25.82+, lng -80.35 far west)

### ✗ COCONUT GROVE (2 buildings) - OUT OF RANGE (lat 25.71-)

### ✗ MIAMI DESIGN DISTRICT (1 building) - OUT OF RANGE (lat 25.81+)

### ✗ LAS OLAS / FORT LAUDERDALE (15 buildings) - ALL OUT OF RANGE (lat 26.11+)

---

## SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Core Miami Buildings (valid coords) | 34 | ✓ In range |
| Core Miami Buildings (needs fixing) | 15 | ⚠ Coordinate issues |
| Far suburbs (should review/remove) | 59 | ✗ Out of range |
| **TOTAL** | **108** | - |

## RECOMMENDED ACTIONS

1. **✓ DONE:** Fixed 3 coordinate issues (Maizon, Flow Brickell, Parkline)
2. **⚠ PENDING:** Fix 12 Wynwood building longitudes (shift -80.199x to -80.189x)
3. **✓ DONE:** Adjusted map zoom to 11, center to 25.765°, -80.185° (fits 25.71-25.82° range)
4. **⚠ CONSIDER:** Remove or relocate 59 far suburb buildings (Aventura, Hollywood, Las Olas, etc.) if focusing on core Miami

---

## MAP COVERAGE

**Current:** Fits all 108 buildings but includes distant suburbs  
**Optimal:** Keep only 34 valid + 12 Wynwood buildings = 46 core Miami buildings (lat 25.71-25.82°)  
**Status:** Map zoom 11 center 25.765, -80.185 displays entire range properly
