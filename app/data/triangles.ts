export type TriangleRow = {
  portfolio: string;
  lob: string;
  accidentYear: number;
  /** development lag in months */
  dev: number;
  paid: number;
  incurred: number;
};

export function getTriangles(): TriangleRow[] {
  const portfolios = ['Alpha', 'Beta'];
  const lobs = ['Auto', 'Property'];
  const accidentYears = [2018, 2019, 2020, 2021, 2022];
  const devMap: Record<string, number[]> = {
    'Alpha-Auto': [12, 24],
    'Alpha-Property': [36, 48],
    'Beta-Auto': [60, 12],
    'Beta-Property': [24, 36],
  };

  const rows: TriangleRow[] = [];

  for (const portfolio of portfolios) {
    for (const lob of lobs) {
      const devs = devMap[`${portfolio}-${lob}`];
      for (const accidentYear of accidentYears) {
        for (const dev of devs) {
          const factor =
            (portfolios.indexOf(portfolio) + 1) *
            (lobs.indexOf(lob) + 1) *
            (accidentYear - 2017);
          const paid = factor * dev * 10;
          const incurred = Math.round(paid * 1.2);
          rows.push({
            portfolio,
            lob,
            accidentYear,
            dev,
            paid,
            incurred,
          });
        }
      }
    }
  }

  return rows;
}
