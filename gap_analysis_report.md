# Market Cap Dataset Gap Analysis Report
*Generated: 2025-01-21*

## Executive Summary

This comprehensive analysis examines market cap data coverage for 16 companies that have been in the top 10. The original requirement was to track "EVERY SINGLE YEAR they were ever public" from IPO to 2025. 

**Critical Findings:**
- **Major Coverage Gaps**: Dataset is only 24.9% complete overall
- **Data Quality Issues**: 75 INTERPOLATED entries + 3 DATA_INCOMPLETE entries
- **IPO Date Verification**: All IPO dates verified and consistent
- **Missing Data Points**: 582 out of 775 total expected data points missing

---

## 1. MISSING YEARS ANALYSIS (By Priority)

### 🚨 CRITICAL PRIORITY COMPANIES

#### GENERAL ELECTRIC COMPANY (GE) - **119 missing years**
**IPO Date**: 1892 ✓ (matches first_public_year)
**Coverage**: 15 of 134 required years (11.2% complete)
**Missing Year Ranges**: 1893-1899, 1901-1919, 1921-1939, 1941-1959, 1961-1979, 1981-1989, 1991-1994, 1996-1999, 2001-2004, 2006-2009, 2011-2014, 2017-2019, 2021-2023, 2025

#### IBM (IBM) - **99 missing years**
**IPO Date**: 1915 ✓ (matches first_public_year)
**Coverage**: 12 of 111 required years (10.8% complete)
**Missing Year Ranges**: 1916-1929, 1931-1949, 1951-1959, 1961-1969, 1971-1979, 1981-1984, 1986-1989, 1991-1999, 2001-2009, 2011-2019, 2021-2023, 2025

#### EXXON MOBIL CORPORATION (XOM) - **87 missing years**
**IPO Date**: ~1920 (as Standard Oil successor) ✓
**Coverage**: 19 of 106 required years (17.9% complete)
**Missing Year Ranges**: 1921-1929, 1931-1939, 1941-1949, 1951-1959, 1961-1969, 1971-1979, 1981-1989, 1991-1994, 1996-1999, 2001-2004, 2006-2009, 2011-2014, 2019, 2021, 2023, 2025
**Data Quality Issues**: 2 DATA_INCOMPLETE entries (1980, 1990)

### 🔥 HIGH PRIORITY COMPANIES

#### WALMART INC. (WMT) - **48 missing years**
**IPO Date**: October 1, 1970 ✓ (matches first_public_year)
**Coverage**: 8 of 56 required years (14.3% complete)
**Missing Year Ranges**: 1971-1979, 1981-1989, 1991-1994, 1996-1999, 2001-2009, 2011-2019, 2021-2023, 2025

#### JPMORGAN CHASE & CO. (JPM) - **45 missing years**
**IPO Date**: 1969 ✓ (matches first_public_year)
**Coverage**: 12 of 57 required years (21.1% complete)
**Missing Year Ranges**: 1970-1979, 1981-1989, 1991-1999, 2001-2004, 2006-2009, 2011-2014, 2016, 2021-2023, 2025

#### BERKSHIRE HATHAWAY INC. (BRK.A) - **44 missing years**
**IPO Date**: 1965 ✓ (matches first_public_year - Buffett takes control)
**Coverage**: 17 of 61 required years (27.9% complete)
**Missing Year Ranges**: 1966-1979, 1981-1989, 1991-1999, 2001-2004, 2006-2009, 2011-2014

### ⚠️ MEDIUM PRIORITY COMPANIES

#### APPLE INC. (AAPL) - **28 missing years**
**IPO Date**: December 12, 1980 ✓ (matches first_public_year)
**Coverage**: 18 of 46 required years (39.1% complete)
**Missing Year Ranges**: 1981-1984, 1986-1989, 1991-1994, 1996-1999, 2001-2004, 2006-2009, 2011-2014

#### TAIWAN SEMICONDUCTOR (TSM) - **26 missing years**
**IPO Date**: September 1994 ✓ (matches first_public_year)
**Coverage**: 6 of 32 required years (18.8% complete)
**Missing Year Ranges**: 1995-1999, 2001-2009, 2011-2019, 2022-2023, 2025

#### MICROSOFT CORPORATION (MSFT) - **23 missing years**
**IPO Date**: March 13, 1986 ✓ (matches first_public_year)
**Coverage**: 17 of 40 required years (42.5% complete)
**Missing Year Ranges**: 1987-1989, 1991-1994, 1996-1999, 2001-2004, 2006-2009, 2011-2014

#### NVIDIA CORPORATION (NVDA) - **17 missing years**
**IPO Date**: January 22, 1999 ✓ (matches first_public_year)
**Coverage**: 10 of 27 required years (37.0% complete)
**Missing Year Ranges**: 2001-2004, 2006-2009, 2011-2014, 2016-2019, 2022

### ✅ LOW PRIORITY COMPANIES (Nearly Complete)

#### AMAZON.COM INC. (AMZN) - **13 missing years**
**IPO Date**: May 15, 1997 ✓ (matches first_public_year)
**Coverage**: 16 of 29 required years (55.2% complete)
**Missing Year Ranges**: 1998-1999, 2001, 2003-2004, 2006-2009, 2011-2014

#### BROADCOM INC. (AVGO) - **13 missing years**
**IPO Date**: February 2009 ✓ (matches first_public_year)
**Coverage**: 4 of 17 required years (23.5% complete)
**Missing Year Ranges**: 2010-2014, 2016-2019, 2021-2024

#### TESLA INC. (TSLA) - **9 missing years**
**IPO Date**: June 29, 2010 ✓ (matches first_public_year)
**Coverage**: 7 of 16 required years (43.8% complete)
**Missing Year Ranges**: 2011-2014, 2016-2019, 2022

#### ALPHABET INC. (GOOGL) - **8 missing years**
**IPO Date**: August 19, 2004 ✓ (matches first_public_year)
**Coverage**: 14 of 22 required years (63.6% complete)
**Missing Year Ranges**: 2006-2009, 2011-2014

#### META PLATFORMS INC. (META) - **2 missing years**
**IPO Date**: May 18, 2012 ✓ (matches first_public_year)
**Coverage**: 12 of 14 required years (85.7% complete)
**Missing Year Ranges**: 2013-2014

#### SAUDI ARAMCO (2222.SR) - **1 missing year**
**IPO Date**: December 11, 2019 ✓ (matches first_public_year)
**Coverage**: 6 of 7 required years (85.7% complete)
**Missing Year Ranges**: 2020

---

## 2. DATA QUALITY ISSUES

### INTERPOLATED Data (Estimated/Calculated Values)
**Total**: 75 entries requiring replacement with real data

**By Company:**
- **AAPL**: 5 entries
- **MSFT**: 2 entries  
- **XOM**: 8 entries
- **GE**: 9 entries
- **IBM**: 9 entries
- **WMT**: 4 entries
- **JPM**: 8 entries
- **GOOGL**: 2 entries
- **META**: 2 entries
- **AMZN**: 5 entries
- **NVDA**: 6 entries
- **SAUDI_ARAMCO**: 1 entry
- **TSLA**: 2 entries
- **BRK_A**: 5 entries
- **TSM**: 4 entries
- **BROADCOM**: 3 entries

### DATA_INCOMPLETE Entries
**Total**: 3 critical entries needing immediate attention
- **XOM 1980**: "Top 3 company, exact figure not specified"  
- **XOM 1990**: "Became #1 largest company in 1989"
- **GE 1980**: "Listed among top companies"

These represent years where we know the companies were significant but lack specific market cap figures.

---

## 3. IPO DATE VERIFICATION

All companies show consistent IPO dates between their notes and first_public_year. No discrepancies found.

---

## 4. COVERAGE COMPLETENESS SUMMARY

| Rank | Company | Ticker | IPO | Expected | Have | Missing | Coverage | Priority |
|------|---------|--------|-----|----------|------|---------|----------|----------|
| 1 | General Electric | GE | 1892 | 134 | 15 | **119** | 11.2% | **CRITICAL** |
| 2 | IBM | IBM | 1915 | 111 | 12 | **99** | 10.8% | **CRITICAL** |
| 3 | Exxon Mobil | XOM | 1920 | 106 | 19 | **87** | 17.9% | **CRITICAL** |
| 4 | Walmart | WMT | 1970 | 56 | 8 | **48** | 14.3% | **HIGH** |
| 5 | JPMorgan Chase | JPM | 1969 | 57 | 12 | **45** | 21.1% | **HIGH** |
| 6 | Berkshire Hathaway | BRK.A | 1965 | 61 | 17 | **44** | 27.9% | **HIGH** |
| 7 | Apple | AAPL | 1980 | 46 | 18 | **28** | 39.1% | **MEDIUM** |
| 8 | Taiwan Semiconductor | TSM | 1994 | 32 | 6 | **26** | 18.8% | **MEDIUM** |
| 9 | Microsoft | MSFT | 1986 | 40 | 17 | **23** | 42.5% | **MEDIUM** |
| 10 | NVIDIA | NVDA | 1999 | 27 | 10 | **17** | 37.0% | **MEDIUM** |
| 11 | Amazon | AMZN | 1997 | 29 | 16 | **13** | 55.2% | **LOW** |
| 12 | Broadcom | AVGO | 2009 | 17 | 4 | **13** | 23.5% | **LOW** |
| 13 | Tesla | TSLA | 2010 | 16 | 7 | **9** | 43.8% | **LOW** |
| 14 | Alphabet/Google | GOOGL | 2004 | 22 | 14 | **8** | 63.6% | **LOW** |
| 15 | Meta/Facebook | META | 2012 | 14 | 12 | **2** | 85.7% | **LOW** |
| 16 | Saudi Aramco | ARAMCO | 2019 | 7 | 6 | **1** | 85.7% | **LOW** |
| **TOTALS** | **16 Companies** | | | **775** | **193** | **582** | **24.9%** | |

---

## 5. PRIORITY RECOMMENDATIONS

### 🚨 CRITICAL Priority (Immediate Action Required)
**305 missing data points across 3 companies**

1. **General Electric (GE)**: 119 missing years + 1 DATA_INCOMPLETE
   - Spans from 1892-2025 with massive gaps
   - Only 11.2% coverage - worst in dataset

2. **IBM**: 99 missing years  
   - Historical giant with 10.8% coverage
   - Missing entire decades of data

3. **Exxon Mobil (XOM)**: 87 missing years + 2 DATA_INCOMPLETE
   - Oldest company (1920) with critical knowledge gaps
   - Missing most of 20th century data

### 🔥 HIGH Priority  
**137 missing data points across 3 companies**

4. **Walmart (WMT)**: 48 missing years (14.3% coverage)
5. **JPMorgan Chase (JPM)**: 45 missing years (21.1% coverage)  
6. **Berkshire Hathaway (BRK.A)**: 44 missing years (27.9% coverage)

### ⚠️ MEDIUM Priority
**91 missing data points across 4 companies**

7. **Apple (AAPL)**: 28 missing years (39.1% coverage)
8. **Taiwan Semiconductor (TSM)**: 26 missing years (18.8% coverage)
9. **Microsoft (MSFT)**: 23 missing years (42.5% coverage)
10. **NVIDIA (NVDA)**: 17 missing years (37.0% coverage)

### ✅ LOW Priority (Focus after major gaps filled)
**49 missing data points across 6 companies**

11-16. Amazon (13), Broadcom (13), Tesla (9), Google (8), Meta (2), Saudi Aramco (1)

---

## 6. OVERALL DATASET STATISTICS

- **Total Required Data Points**: 775 (sum of all years from IPO to 2025)
- **Current Data Points**: 193 (24.9% complete)
- **Missing Data Points**: 582 (75.1% missing)
- **INTERPOLATED Entries**: 75 (need replacement with real data)
- **DATA_INCOMPLETE Entries**: 3 (critical knowledge gaps)

### Data Quality Summary:
- **Real Historical Data**: 118 entries (15.2%)
- **INTERPOLATED Data**: 75 entries (9.7%)
- **Missing/Unknown**: 582 entries (75.1%)

**The dataset is currently only 24.9% complete for the stated goal of tracking "EVERY SINGLE YEAR they were ever public."**

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: CRITICAL Companies (Target: 305 data points)
- **GE (1893-2025)**: Focus on major industrial periods - 1920s boom, WWII, conglomerate era, Welch years, financial crisis
- **IBM (1916-2025)**: Mainframe dominance, PC era, services transformation, cloud/AI pivot
- **XOM (1921-2025)**: Oil crises, mega-mergers, shale revolution periods
- **Estimated Timeline**: 3-4 months with dedicated research

### Phase 2: HIGH Priority Companies (Target: 137 data points)  
- **WMT**: Regional expansion, national dominance, e-commerce transition
- **JPM**: Banking consolidation, financial crises, regulatory changes
- **BRK.A**: Buffett acquisition spree, insurance float growth
- **Estimated Timeline**: 2-3 months

### Phase 3: MEDIUM Priority (Target: 91 data points)
- Focus on tech boom/bust cycles, mobile revolution, AI emergence
- **Estimated Timeline**: 2 months

### Phase 4: Quality Improvement
- Replace all 75 INTERPOLATED entries with verified data
- Validate accuracy across existing entries
- **Estimated Timeline**: 1 month

### Data Collection Strategy:
1. **Primary Sources**: SEC filings (10-K, 10-Q), annual reports
2. **Financial Databases**: Bloomberg, FactSet, S&P Capital IQ, CRSP
3. **Historical Archives**: NYT financial archives, WSJ historical data
4. **Academic Sources**: NBER, Fed databases, business history journals
5. **Cross-validation**: Multiple source confirmation for each data point

### Success Metrics:
- **Completion Target**: 95% coverage (737/775 data points)
- **Quality Target**: <10 INTERPOLATED entries remaining
- **Validation**: Each data point verified by 2+ independent sources

This comprehensive gap analysis reveals the substantial work required to achieve complete historical market cap coverage for all companies that have reached top 10 status.