import { BarChart } from './BarChart'

// Figma's BarChart: six months of income, 316 by 160, November now. The
// widths and values are picked so every bar is whole pixels: 46px wide and
// value / 20 tall.
const data = [
  { label: 'Jun', value: 1200 }, { label: 'Jul', value: 1800 }, { label: 'Aug', value: 1500 },
  { label: 'Sep', value: 2400 }, { label: 'Oct', value: 2100 }, { label: 'Nov', value: 2760 },
].map((d) => ({ ...d, valueText: `€${d.value.toLocaleString('en')}` }))
const sample = <BarChart label="Income by month" data={data} current={5} />
export const fixtures = [{ node: '749:23', name: 'bar-chart', element: <div style={{ width: 316 }}>{sample}</div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { BarChart } from 'rost/components/bar-chart/BarChart'

<BarChart
  label="Income by month"
  data={months.map((m) => ({ label: m.short, value: m.income, valueText: euros(m.income) }))}
  current={months.length - 1}
/>`

/** What the component's card on rost.build shows. */
export const preview = <div style={{ width: 240 }}><BarChart label="Income by month" data={data} current={5} height={120} /></div>
