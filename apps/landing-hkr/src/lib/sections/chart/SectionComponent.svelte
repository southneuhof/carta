<script lang="ts">
  import type { ChartConfiguration } from 'chart.js/auto';
  import Chart from '$lib/components/Chart.svelte';
  import SectionHeader from '$lib/app/components/app/SectionHeader.svelte';
  import { widthPresetClassMap } from '$lib/utils/uicommon';
  
  const { section } = $props();
  
  // Define color map type and values
  type ColorName = 'orange' | 'blue' | 'green' | 'red' | 'yellow';
  
  interface ColorSet {
    background: string;
    border: string;
  }
  
  const colorMap: Record<ColorName, ColorSet> = {
    orange: {
      background: 'rgba(255, 152, 0, 0.2)',
      border: 'rgba(255, 152, 0, 1)'
    },
    blue: {
      background: 'rgba(33, 150, 243, 0.2)',
      border: 'rgba(33, 150, 243, 1)'
    },
    green: {
      background: 'rgba(76, 175, 80, 0.2)',
      border: 'rgba(76, 175, 80, 1)'
    },
    red: {
      background: 'rgba(244, 67, 54, 0.2)',
      border: 'rgba(244, 67, 54, 1)'
    },
    yellow: {
      background: 'rgba(255, 235, 59, 0.2)',
      border: 'rgba(255, 235, 59, 1)'
    }
  };
  
  // Get colors based on section.meta.color or default to orange
  const colorName: ColorName = (section.meta?.color && ['orange', 'blue', 'green', 'red', 'yellow'].includes(section.meta.color))
    ? section.meta.color as ColorName
    : 'orange';
  const chartColors = colorMap[colorName];
  
  // Chart configuration
  const chartConfig: ChartConfiguration = {
    type: section.meta.type,
    data: {
      labels: section.data.gallery.map((item: any) => item.label),
      datasets: [
        {
          label: section.data.content.title,
          data: section.data.gallery.map((item: any) => item.amount),
          backgroundColor: chartColors.background,
          borderColor: chartColors.border,
          borderWidth: 1,
          tension: 0.4
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };
</script>

<div class="flex items-center justify-center w-full">
  <div class="w-full {widthPresetClassMap[section.meta.width_preset]} flex flex-col gap-base py-6 lg:py-12 px-6 lg:px-12">
    <SectionHeader header={section.data.content} titleSize={"xl"} defaultAlign="center" swapTitlePosition/>
    <Chart config={chartConfig} className="custom-chart" />
  </div>
</div>
