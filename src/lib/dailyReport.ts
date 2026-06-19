type ReportItem = {
  srNumber: number;
  title: string;
  status: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
};

const BRAND: [number, number, number] = [21, 101, 216]; // #1565d8 logo blue

function isSameDay(iso: string | undefined, ref: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function formatDuration(ms?: number): string {
  if (typeof ms !== "number") return "—";
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function time(iso?: string): string {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

/**

* Builds and downloads a PDF of the news completed on the given day
 * (defaults to today). Returns how many completed items were included.
 */
export async function exportDailyReport(
  items: ReportItem[],
  targetDate: Date = new Date()
): Promise<{ count: number }> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const completedToday = items
    .filter((i) => i.status === "done" && isSameDay(i.completedAt, targetDate))
    .sort((a, b) => a.srNumber - b.srNumber);

  const createdToday = items.filter((i) => isSameDay(i.createdAt, targetDate));
  const stillOpen = createdToday.filter((i) => i.status !== "done");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateLabel = targetDate.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("JK News  Daily Report", 40, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(dateLabel, 40, 56);

  // Summary
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  const summary = `Completed today: ${completedToday.length}   |   Created today: ${createdToday.length}   |   Still in progress: ${stillOpen.length}`;
  doc.text(summary, 40, 100);

  // Completed-today table
  autoTable(doc, {
    startY: 120,
    head: [["Sr #", "News", "Name", "Started", "Completed", "Turnaround"]],
    body: completedToday.length
      ? completedToday.map((i, idx) => [
          `#${idx + 1}`,
          i.title,
          i.createdByName || i.createdBy,
          time(i.startedAt),
          time(i.completedAt),
          formatDuration(i.durationMs),
        ])
      : [["—", "No news completed today", "", "", "", ""]],
    headStyles: { fillColor: BRAND, textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    alternateRowStyles: { fillColor: [245, 245, 248] },
  });

  // Still-in-progress table (if any)
  if (stillOpen.length) {
    const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Still in progress (created today)", 40, y + 28);
    autoTable(doc, {
      startY: y + 38,
      head: [["Sr #", "News", "Name", "Stage"]],
      body: stillOpen.map((i, idx) => [`#${idx + 1}`, i.title, i.createdByName || i.createdBy, i.status]),
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 6 },
      alternateRowStyles: { fillColor: [245, 245, 248] },
    });
  }

  const stamp = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
  doc.save(`JK-News-Daily-Report-${stamp}.pdf`);

  return { count: completedToday.length };
}
