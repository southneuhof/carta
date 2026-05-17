<script setup lang="ts">
import services from '@/utils/services';
import { provide, ref } from 'vue';
import DashboardFilter from './_layouts/DashboardFilter.vue';
import PageViewDashboard from './_layouts/PageViewDashboard.vue';
import 'chart.js/auto';
import WebsiteVisit from './_layouts/WebsiteVisit.vue';
import AnalyticsChart from './_layouts/AnalyticsChart.vue';
import AggregateFormSubmission from './_layouts/AggregateFormSubmission.vue';

const filter = ref({start_month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, end_month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`})
provide('filter', filter)
</script>

<template>
  <div class="flex flex-col gap-4">
    <DashboardFilter v-model="filter"/>
    <div :key="JSON.stringify(filter)" class="flex flex-col gap-4">
      <div class="grid gap-4">
        <!-- <AggregateFormSubmission/> -->
        <AnalyticsChart event_type="page_view" title="Kunjungan Halaman" parseAs="slug"/>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <AnalyticsChart event_type="website_visit" title="Kunjungan Website" parseAs="month"/>
        <AnalyticsChart event_type="form_submission" title="Pengisian Form" parseAs="slug"/>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <AnalyticsChart event_type="cta_click" title="Klik Call To Action"/>
        <AnalyticsChart event_type="contact_click" title="Klik Contact"/>
        <AnalyticsChart event_type="calculator_usage" title="Penggunaan Kalkulator" parseAs="slug"/>
      </div>
    </div>
  </div>
</template>