<script lang="ts">
  import { Chart, type ChartConfiguration } from 'chart.js/auto';
  import { onMount, onDestroy } from 'svelte';

  let { config, className = '' } = $props<{
    config: ChartConfiguration;
    className?: string;
  }>();
  
  let canvas: HTMLCanvasElement | null = null;
  let chart: Chart | null = null;
  
  // Initialize chart when component mounts or config changes
  $effect(() => {
    if (!canvas) return;
    
    // Destroy existing chart if it exists
    if (chart) {
      chart.destroy();
    }
    
    // Create new chart instance
    chart = new Chart(canvas, config);
    
    // Cleanup function
    return () => {
      if (chart) {
        chart.destroy();
        chart = null;
      }
    };
  });
  
  // Cleanup on destroy
  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<div class:chart-container={true} class={className}>
  <canvas
    bind:this={canvas}
    aria-label="Data visualization chart"
  ></canvas>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 300px;
  }
  
  :global(.chart-container canvas) {
    width: 100% !important;
    height: 100% !important;
  }
</style>
