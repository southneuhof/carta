<script lang="ts">
  const {
    href,
    label,
    tone = "primary",
  }: {
    href: string;
    label: string;
    tone?: "primary" | "secondary";
  } = $props();

  const toneClassMap = {
    primary: "bg-[#EF4444] text-white",
    secondary: "bg-[#3B82F6] text-white",
  } as const;
</script>

<a
  href={href}
  class="inline-flex items-center justify-center h-12 px-8 rounded-full font-semibold text-lg {toneClassMap[tone]}"
>
  {label}
</a>
