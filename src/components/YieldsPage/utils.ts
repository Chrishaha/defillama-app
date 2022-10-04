import { attributeOptions } from '~/components/Filters'

export function toFilterPool({
	curr,
	selectedProjects,
	selectedChains,
	selectedAttributes,
	includeTokens,
	excludeTokens,
	selectedCategories,
	pathname,
	minTvl,
	maxTvl,
	minApy,
	maxApy
}) {
	let toFilter = true

	// used in pages like /yields/stablecoins to filter some pools by default
	attributeOptions.forEach((option) => {
		// check if this page has default attribute filter function
		if (option.defaultFilterFnOnPage[pathname]) {
			// apply default attribute filter function
			toFilter = toFilter && option.defaultFilterFnOnPage[pathname](curr)
		}
	})

	selectedAttributes.forEach((attribute) => {
		const attributeOption = attributeOptions.find((o) => o.key === attribute)

		if (attributeOption) {
			toFilter = toFilter && attributeOption.filterFn(curr)
		}
	})

	toFilter = toFilter && selectedProjects?.map((p) => p.toLowerCase()).includes(curr.project.toLowerCase())

	toFilter = toFilter && selectedCategories?.map((p) => p.toLowerCase()).includes(curr.category.toLowerCase())

	const tokensInPool: string[] = curr.symbol.split('-').map((x) => x.toLowerCase())

	const includeToken =
		includeTokens.length > 0
			? includeTokens
					.map((t) => t.toLowerCase())
					.find((token) => {
						if (tokensInPool.some((x) => x.includes(token.toLowerCase()))) {
							return true
						} else if (token === 'eth') {
							return tokensInPool.find((x) => x.includes('weth') && x.includes(token))
						} else return false
					})
			: true

	const excludeToken = !excludeTokens
		.map((t) => t.toLowerCase())
		.find((token) => tokensInPool.includes(token.toLowerCase()))

	toFilter =
		toFilter &&
		selectedChains.map((t) => t.toLowerCase()).includes(curr.chain.toLowerCase()) &&
		includeToken &&
		excludeToken

	const isValidTvlRange =
		(minTvl !== undefined && !Number.isNaN(Number(minTvl))) || (maxTvl !== undefined && !Number.isNaN(Number(maxTvl)))

	const isValidApyRange =
		(minApy !== undefined && !Number.isNaN(Number(minApy))) || (maxApy !== undefined && !Number.isNaN(Number(maxApy)))

	if (isValidTvlRange) {
		toFilter = toFilter && (minTvl ? curr.tvlUsd > minTvl : true) && (maxTvl ? curr.tvlUsd < maxTvl : true)
	}

	if (isValidApyRange) {
		toFilter = toFilter && (minApy ? curr.apy > minApy : true) && (maxApy ? curr.apy < maxApy : true)
	}

	return toFilter
}