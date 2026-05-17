<script lang="ts">
  import { DatePicker } from "bits-ui";
  import { CalendarDate, type DateValue } from "@internationalized/date";
  import { fade } from "svelte/transition";

  let {
    value = $bindable(),
    label,
    required,
    helperMessage = null, // New prop
    errorMessage = null,         // New prop
  }: {
    value: Date | null | undefined,
    label?: string
    required?: boolean
    helperMessage?: string | null // New prop
    errorMessage?: string | null         // New prop
  } = $props();

  function dateToCalendarDate(date: Date | null | undefined): CalendarDate | undefined {
    if (!date) return undefined;
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  function calendarDateToDate(calendarDate: DateValue | undefined): Date | null | undefined {
    if (!calendarDate) return null;
    if (calendarDate instanceof CalendarDate) {
       return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
    }
    console.warn("Unsupported DateValue type for conversion to Date");
    return null;
  }

  function getValue() {
    return dateToCalendarDate(value)
  }

  function setValue(newValue: DateValue | undefined) {
    value = calendarDateToDate(newValue);
  }
</script>

<DatePicker.Root weekdayFormat="short" fixedWeeks={true} bind:value={getValue, setValue}>
  <div class="flex flex-col gap-xs">
    {#if label}
      <DatePicker.Label class="font-medium text-xs">
        {label}
        {#if required}<span class="text-xs text-primary">*</span>{/if}
      </DatePicker.Label>
    {/if}
    <DatePicker.Input class="px-4 py-3 rounded-sm outline outline-outline-variant focus-within:outline-outline select-none flex flex-row items-center justify-between text-sm tracking-[0.01em]">
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <div class="inline-block select-none">
            {#if part === "literal"}
              <DatePicker.Segment {part} class="text-outline p-1">
                {value}
              </DatePicker.Segment>
            {:else}
              <DatePicker.Segment
                {part}
                class="rounded-sm hover:bg-surface-muted focus:bg-surface-muted focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
              >
                {value}
              </DatePicker.Segment>
            {/if}
          </div>
        {/each}
        <DatePicker.Trigger
          class="hover:bg-surface-muted active:bg-surface-muted ml-auto inline-flex size-8 items-center justify-center rounded-sm transition-all"
        >
           <i class="ri-calendar-line text-lg"></i>
        </DatePicker.Trigger>
      {/snippet}
    </DatePicker.Input>
    {#if errorMessage}
      <p class="text-xs text-error">{errorMessage}</p>
    {:else if helperMessage}
      <p class="text-xs text-outline">{helperMessage}</p>
    {/if}
    <DatePicker.Content sideOffset={6} class="z-50">
      <DatePicker.Calendar class="outline outline-outline-variant bg-surface rounded-lg p-4">
        {#snippet children({ months, weekdays })}
          <DatePicker.Header class="flex items-center justify-between">
            <DatePicker.PrevButton
              class="rounded-lg hover:bg-surface-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
            >
              <i class="ri-arrow-left-s-line text-lg"></i>
            </DatePicker.PrevButton>
            <DatePicker.Heading class="text-[15px] font-medium" />
            <DatePicker.NextButton
              class="rounded-lg hover:bg-surface-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
            >
              <i class="ri-arrow-right-s-line text-lg"></i>
            </DatePicker.NextButton>
          </DatePicker.Header>
          <div
            class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            {#each months as month}
              <DatePicker.Grid
                class="w-full border-collapse select-none space-y-1"
              >
                <DatePicker.GridHead>
                  <DatePicker.GridRow class="mb-1 flex w-full justify-between">
                    {#each weekdays as day}
                      <DatePicker.HeadCell
                        class="text-outline font-normal! w-10 rounded-md text-xs"
                      >
                        <div>{day.slice(0, 2)}</div>
                      </DatePicker.HeadCell>
                    {/each}
                  </DatePicker.GridRow>
                </DatePicker.GridHead>
                <DatePicker.GridBody>
                  {#each month.weeks as weekDates}
                    <DatePicker.GridRow class="flex w-full">
                      {#each weekDates as date}
                        <DatePicker.Cell
                          {date}
                          month={month.value}
                          class="p-0! relative size-10 text-center text-sm"
                        >
                          <DatePicker.Day
                            class="rounded-lg text-on-surface hover:bg-surface-muted data-selected:bg-secondary-muted data-disabled:text-outline-variant data-unavailable:text-outline-variant data-disabled:pointer-events-none data-outside-month:pointer-events-none data-selected:font-medium data-unavailable:line-through group relative inline-flex size-10 items-center justify-center whitespace-nowrap border border-transparent bg-transparent p-0 text-sm font-normal"
                          >
                            <div
                              class="bg-foreground group-data-selected:bg-background group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"
                            ></div>
                            {date.day}
                          </DatePicker.Day>
                        </DatePicker.Cell>
                      {/each}
                    </DatePicker.GridRow>
                  {/each}
                </DatePicker.GridBody>
              </DatePicker.Grid>
            {/each}
          </div>
        {/snippet}
      </DatePicker.Calendar>
    </DatePicker.Content>
  </div>
</DatePicker.Root>
<!-- <DatePicker.Root weekdayFormat="short" fixedWeeks={true} bind:value={getValue, setValue}>
  <div class="flex w-full flex-col gap-1.5">
    <DatePicker.Label class="block select-none text-sm font-medium"
      >{label}</DatePicker.Label
    >
    <DatePicker.Input
      class="h-input rounded-input border-border-input bg-background text-foreground focus-within:border-border-input-hover focus-within:shadow-date-field-focus hover:border-border-input-hover flex w-full max-w-[232px] select-none items-center border px-2 py-3 text-sm tracking-[0.01em]"
    >
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <div class="inline-block select-none">
            {#if part === "literal"}
              <DatePicker.Segment {part} class="text-outline p-1">
                {value}
              </DatePicker.Segment>
            {:else}
              <DatePicker.Segment
                {part}
                class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-outline focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
              >
                {value}
              </DatePicker.Segment>
            {/if}
          </div>
        {/each}
        <DatePicker.Trigger
          class="text-foreground/60 hover:bg-muted active:bg-dark-10 ml-auto inline-flex size-8 items-center justify-center rounded-[5px] transition-all"
        >
           <i class="ri-calendar-line text-lg"></i>
        </DatePicker.Trigger>
      {/snippet}
    </DatePicker.Input>
    <DatePicker.Content sideOffset={6} class="z-50">
      <DatePicker.Calendar
        class="border-dark-10 bg-background-alt shadow-popover rounded-[15px] border p-[22px]"
      >
        {#snippet children({ months, weekdays })}
          <DatePicker.Header class="flex items-center justify-between">
            <DatePicker.PrevButton
              class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
            >
              <CaretLeft class="size-6" />
            </DatePicker.PrevButton>
            <DatePicker.Heading class="text-[15px] font-medium" />
            <DatePicker.NextButton
              class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
            >
              <CaretRight class="size-6" />
            </DatePicker.NextButton>
          </DatePicker.Header>
          <div
            class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            {#each months as month}
              <DatePicker.Grid
                class="w-full border-collapse select-none space-y-1"
              >
                <DatePicker.GridHead>
                  <DatePicker.GridRow class="mb-1 flex w-full justify-between">
                    {#each weekdays as day}
                      <DatePicker.HeadCell
                        class="text-outline font-normal! w-10 rounded-md text-xs"
                      >
                        <div>{day.slice(0, 2)}</div>
                      </DatePicker.HeadCell>
                    {/each}
                  </DatePicker.GridRow>
                </DatePicker.GridHead>
                <DatePicker.GridBody>
                  {#each month.weeks as weekDates}
                    <DatePicker.GridRow class="flex w-full">
                      {#each weekDates as date}
                        <DatePicker.Cell
                          {date}
                          month={month.value}
                          class="p-0! relative size-10 text-center text-sm"
                        >
                          <DatePicker.Day
                            class="rounded-9px text-foreground hover:border-foreground data-selected:bg-foreground data-disabled:text-foreground/30 data-selected:text-background data-unavailable:text-outline data-disabled:pointer-events-none data-outside-month:pointer-events-none data-selected:font-medium data-unavailable:line-through group relative inline-flex size-10 items-center justify-center whitespace-nowrap border border-transparent bg-transparent p-0 text-sm font-normal transition-all"
                          >
                            <div
                              class="bg-foreground group-data-selected:bg-background group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"
                            ></div>
                            {date.day}
                          </DatePicker.Day>
                        </DatePicker.Cell>
                      {/each}
                    </DatePicker.GridRow>
                  {/each}
                </DatePicker.GridBody>
              </DatePicker.Grid>
            {/each}
          </div>
        {/snippet}
      </DatePicker.Calendar>
    </DatePicker.Content>
  </div>
</DatePicker.Root> -->