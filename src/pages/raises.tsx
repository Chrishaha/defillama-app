import * as React from 'react'
import { maxAgeForNext } from '~/api'
import { getRaisesFiltersList } from '~/api/categories/raises'
import { RAISES_API } from '~/constants'
import RaisesContainer from '~/containers/Raises'
import { toYearMonth } from '~/utils'
import { withPerformanceLogging } from '~/utils/perf'

export const getStaticProps = withPerformanceLogging('raises', async () => {
	const data = await fetch(RAISES_API).then((r) => r.json())

	const monthlyInvestment = {}

	data.raises.forEach((r) => {
		// split EOS raised amount between 13 months
		if (r.name === 'EOS') {
			for (let month = 0; month < 13; month++) {
				const date = toYearMonth(r.date - month * 2_529_746)
				monthlyInvestment[date] = (monthlyInvestment[date] ?? 0) + (r.amount ?? 0) / 13
			}
		} else {
			const monthlyDate = toYearMonth(r.date)

			monthlyInvestment[monthlyDate] = (monthlyInvestment[monthlyDate] ?? 0) + (r.amount ?? 0)
		}
	})

	const filters = getRaisesFiltersList(data)

	return {
		props: {
			raises: data.raises,
			monthlyInvestment: Object.entries(monthlyInvestment).map((t) => [
				new Date(t[0]).getTime() / 1e3,
				Number.isNaN(Number(t[1])) ? 0 : Number(t[1]) * 1e6
			]),
			...filters
		},
		revalidate: maxAgeForNext([22])
	}
})

const Raises = (props) => {
	return <RaisesContainer {...props} investorName={null} />
}

export default Raises
