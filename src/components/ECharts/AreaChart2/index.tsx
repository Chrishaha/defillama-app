import { useCallback, useEffect, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { v4 as uuid } from 'uuid'
import styled from 'styled-components'
import { useDarkModeManager } from '~/contexts/LocalStorage'
import { getUtcDateObject, stringToColour } from '../utils'
import type { IChartProps } from '../types'
import { useDefaults } from '../useDefaults'
import { toK } from '~/utils'

const Wrapper = styled.div`
	--gradient-end: ${({ theme }) => (theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)')};
`

export default function AreaChart({
	chartData,
	stacks,
	stackColors,
	valueSymbol = '',
	title,
	color,
	hallmarks,
	customLegendName,
	customLegendOptions,
	tooltipSort = true,
	chartOptions,
	height = '360px',
	expandTo100Percent = false,
	isStackedChart,
	hideGradient = false,
	...props
}: IChartProps) {
	const id = useMemo(() => uuid(), [])

	const chartsStack = stacks || customLegendOptions

	const [isDark] = useDarkModeManager()

	const defaultChartSettings = useDefaults({
		color,
		title,
		valueSymbol,
		tooltipSort,
		hideLegend: true,
		isStackedChart
	})

	const series = useMemo(() => {
		const chartColor = color || stringToColour()

		const series = chartsStack.map((stack, index) => {
			const stackColor = stackColors?.[stack]

			return {
				name: stack,
				type: 'line',
				yAxisIndex: index,
				scale: true,
				large: true,
				largeThreshold: 0,
				emphasis: {
					focus: 'series',
					shadowBlur: 10
				},
				symbol: 'none',
				itemStyle: {
					color: stackColor || null
				},

				areaStyle: {
					color: !customLegendName
						? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{
									offset: 0,
									color: stackColor ? stackColor : index === 0 ? chartColor : 'transparent'
								},
								{
									offset: 1,
									color: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'
								}
						  ])
						: null
				},
				markLine: {},
				data: []
			}
		})

		chartData.forEach(({ date, ...item }) => {
			stacks.forEach((stack) => {
				series.find((t) => t.name === stack)?.data.push([getUtcDateObject(date), item[stack] || 0])
			})
		})

		return series
	}, [chartData, chartsStack, color, customLegendName, isDark, stackColors, stacks])

	const createInstance = useCallback(() => {
		const instance = echarts.getInstanceByDom(document.getElementById(id))

		return instance || echarts.init(document.getElementById(id))
	}, [id])

	useEffect(() => {
		// create instance
		const chartInstance = createInstance()

		const { graphic, titleDefaults, grid, tooltip, xAxis, yAxis, dataZoom } = defaultChartSettings

		for (const option in chartOptions) {
			if (defaultChartSettings[option]) {
				defaultChartSettings[option] = { ...defaultChartSettings[option], ...chartOptions[option] }
			} else {
				defaultChartSettings[option] = { ...chartOptions[option] }
			}
		}

		dataZoom[1] = { ...dataZoom[1], left: 20, right: 20 } as any

		chartInstance.setOption({
			graphic: { ...graphic },
			tooltip: {
				...tooltip,
				position: [60, 0],
				backgroundColor: 'none',
				borderWidth: '0',
				padding: 0,
				textStyle: {
					color: isDark ? 'white' : 'black'
				}
			},
			title: {
				...titleDefaults
			},
			grid: {
				...grid
			},
			xAxis: {
				...xAxis
			},
			yAxis:
				stacks.length === 1
					? yAxis
					: [
							{
								...yAxis,
								axisLabel: {
									formatter: (value) => value + '%'
								},
								axisLine: {
									show: true,
									lineStyle: {
										color: stackColors['APY']
									}
								}
							},
							{
								...yAxis,
								axisLabel: {
									formatter: (value) => '$' + toK(value)
								},
								axisLine: {
									show: true,
									lineStyle: {
										color: stackColors['TVL']
									}
								}
							}
					  ],
			dataZoom: [...dataZoom],
			series
		})

		chartInstance.dispatchAction({
			type: 'showTip',
			// index of series, which is optional when trigger of tooltip is axis
			seriesIndex: 0,
			// data index; could assign by name attribute when not defined
			dataIndex: series[0].data.length - 1,
			// Position of tooltip. Only works in this action.
			// Use tooltip.position in option by default.
			position: [60, 0]
		})

		chartInstance.on('globalout', () => {
			chartInstance.dispatchAction({
				type: 'showTip',
				// index of series, which is optional when trigger of tooltip is axis
				seriesIndex: 0,
				// data index; could assign by name attribute when not defined
				dataIndex: series[0].data.length - 1,
				// Position of tooltip. Only works in this action.
				// Use tooltip.position in option by default.
				position: [60, 0]
			})
		})

		function resize() {
			chartInstance.resize()
		}

		window.addEventListener('resize', resize)

		return () => {
			window.removeEventListener('resize', resize)
			chartInstance.dispose()
		}
	}, [createInstance, defaultChartSettings, series, chartOptions, stackColors, isDark, stacks.length])

	return (
		<div style={{ position: 'relative' }} {...props}>
			<Wrapper id={id} style={{ height, margin: 'auto 0' }}></Wrapper>
		</div>
	)
}
