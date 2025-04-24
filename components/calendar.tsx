"use client";

import { useEffect, useState, useMemo } from "react";
import {
  format,
  addWeeks,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  getYear,
  startOfYear,
  differenceInWeeks,
  isFuture,
  isThisWeek,
  parseISO,
  formatDistanceToNow,
} from "date-fns";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { YearNote } from "./year-note";
import { extractFirstEmoji, containsNumbers } from "@/utils/emoji";
import { extractHexColor } from "@/utils/color";

interface HighlightInfo {
  date: Date;
  title?: string;
}

interface YearNoteType {
  year: number;
  note: string;
}

interface CalendarProps {
  initialStartDate: Date;
  initialEndDate: Date;
}

export function Calendar({ initialStartDate, initialEndDate }: CalendarProps) {
  // Use localStorage to persist data
  const [startDate, setStartDate] = useLocalStorage<string>(
    "calendar-start-date",
    initialStartDate.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useLocalStorage<string>(
    "calendar-end-date",
    initialEndDate.toISOString().split("T")[0]
  );
  const [highlightedDates, setHighlightedDates] = useLocalStorage<
    { date: string; title?: string }[]
  >("calendar-highlighted-dates", []);
  const [yearNotes, setYearNotes] = useLocalStorage<YearNoteType[]>(
    "calendar-year-notes",
    []
  );

  const [yearData, setYearData] = useState<
    Map<
      number,
      {
        weeks: {
          date: Date;
          isHighlighted: boolean;
          highlightTitle?: string;
          emoji?: string | null;
          hasNumbers: boolean;
          isPlaceholder: boolean;
          isFuture: boolean;
          isCurrentWeek: boolean;
          backgroundColor: string | null;
        }[];
        note?: string;
      }
    >
  >(new Map());
  const [years, setYears] = useState<number[]>([]);

  // Get current date for input constraints
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Memoize parsed dates to prevent recreation on each render
  const parsedStartDate = useMemo(() => parseISO(startDate), [startDate]);
  const parsedEndDate = useMemo(() => parseISO(endDate), [endDate]);

  // Memoize parsed highlighted dates to prevent recreation on each render
  const parsedHighlightedDates = useMemo(
    () =>
      highlightedDates.map((h) => ({
        date: parseISO(h.date),
        title: h.title,
        emoji: extractFirstEmoji(h.title),
        hasNumbers: containsNumbers(h.title),
        hexColor: extractHexColor(h.title),
      })),
    [highlightedDates]
  );

  // Generate calendar data when dependencies change
  useEffect(() => {
    const yearMap = new Map<
      number,
      {
        weeks: {
          date: Date;
          isHighlighted: boolean;
          highlightTitle?: string;
          emoji?: string | null;
          hasNumbers: boolean;
          isPlaceholder: boolean;
          isFuture: boolean;
          isCurrentWeek: boolean;
          backgroundColor: string | null;
        }[];
        note?: string;
      }
    >();
    const uniqueYears = new Set<number>();

    // Initialize all years in the range
    for (
      let year = getYear(parsedStartDate);
      year <= getYear(parsedEndDate);
      year++
    ) {
      uniqueYears.add(year);

      // Create 52 placeholder weeks for each year
      const yearStart = new Date(year, 0, 1);
      const placeholderWeeks = Array(52)
        .fill(null)
        .map((_, i) => {
          const weekDate = addWeeks(yearStart, i);
          return {
            date: weekDate,
            isHighlighted: false,
            highlightTitle: undefined,
            emoji: null,
            hasNumbers: false,
            isPlaceholder: true,
            isFuture: isFuture(weekDate),
            isCurrentWeek: isThisWeek(weekDate),
            backgroundColor: null,
          };
        });

      yearMap.set(year, {
        weeks: placeholderWeeks,
        note: yearNotes.find((n) => n.year === year)?.note,
      });
    }

    // Fill in actual weeks
    let currentDate = startOfWeek(parsedStartDate, { weekStartsOn: 1 });
    let currentBackgroundColor: string | null = null;

    while (currentDate <= parsedEndDate) {
      const year = getYear(currentDate);
      const yearStart = startOfYear(new Date(year, 0, 1));
      const weekIndex = differenceInWeeks(currentDate, yearStart);

      // Check if this week contains any of the highlighted dates
      const highlightInfo = parsedHighlightedDates.find((info) =>
        isWithinInterval(info.date, {
          start: currentDate,
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        })
      );

      // Update the background color if this week has one
      if (highlightInfo?.hexColor) {
        currentBackgroundColor = highlightInfo.hexColor;
      }

      // Update the week data
      const yearData = yearMap.get(year);
      if (yearData && weekIndex >= 0 && weekIndex < 52) {
        yearData.weeks[weekIndex] = {
          date: currentDate,
          isHighlighted: !!highlightInfo,
          highlightTitle: highlightInfo?.title,
          emoji: highlightInfo?.emoji,
          hasNumbers: highlightInfo?.hasNumbers || false,
          isPlaceholder: false,
          isFuture: isFuture(currentDate),
          isCurrentWeek: isThisWeek(currentDate),
          backgroundColor: currentBackgroundColor,
        };
      }

      currentDate = addWeeks(currentDate, 1);
    }

    setYearData(yearMap);
    setYears(Array.from(uniqueYears).sort());
  }, [parsedStartDate, parsedEndDate, parsedHighlightedDates, yearNotes]);

  const handleWeekClick = (date: Date) => {
    // Find the highlighted date that corresponds to this week
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    // First try to find an exact match in the highlighted dates
    let dateStr = "";
    let existingHighlight = null;

    // Check if any highlighted date falls within this week
    for (const highlight of highlightedDates) {
      const highlightDate = parseISO(highlight.date);
      if (isWithinInterval(highlightDate, { start: weekStart, end: weekEnd })) {
        dateStr = highlight.date;
        existingHighlight = highlight;
        break;
      }
    }

    // If no match found, use the week start date
    if (!dateStr) {
      dateStr = weekStart.toISOString().split("T")[0];
    }

    const title = window.prompt(
      "Enter a label for this week:",
      existingHighlight?.title || ""
    );

    if (title === null) {
      // User cancelled the prompt
      return;
    }

    if (title === "") {
      // Remove the highlight if title is empty
      setHighlightedDates(highlightedDates.filter((h) => h.date !== dateStr));
    } else if (existingHighlight) {
      // Update existing highlight
      setHighlightedDates(
        highlightedDates.map((h) => (h.date === dateStr ? { ...h, title } : h))
      );
    } else {
      // Add new highlight
      setHighlightedDates([...highlightedDates, { date: dateStr, title }]);
    }
  };

  const handleYearNoteChange = (year: number, note: string) => {
    if (note) {
      // Update or add note
      const existingNoteIndex = yearNotes.findIndex((n) => n.year === year);
      if (existingNoteIndex >= 0) {
        const updatedNotes = [...yearNotes];
        updatedNotes[existingNoteIndex] = { year, note };
        setYearNotes(updatedNotes);
      } else {
        setYearNotes([...yearNotes, { year, note }]);
      }
    } else {
      // Remove note if empty
      setYearNotes(yearNotes.filter((n) => n.year !== year));
    }
  };

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={today}
            className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 w-40"
          />
          <span className="text-lg">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={today}
            className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 w-40"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          {years.map((year) => {
            const data = yearData.get(year);
            if (!data) return null;

            return (
              <div key={year} className="flex items-center h-3 mb-0.5">
                <div className="font-mono text-xs w-16 flex-shrink-0 text-right pr-2 dark:text-gray-400">
                  {year}
                </div>
                <div className="flex flex-grow items-center justify-center">
                  {data.weeks.map((week, index) => {
                    // Determine if we should show an emoji
                    const showEmoji = week.emoji && !week.isPlaceholder;

                    // Determine background style
                    const weekStyle: React.CSSProperties = {};
                    if (week.backgroundColor && !showEmoji) {
                      weekStyle.backgroundColor = week.backgroundColor;
                    }

                    return (
                      <div
                        key={index}
                        className={`
                          w-3 h-3
                          mr-0.5
                          relative
                          group
                          cursor-pointer
                          flex items-center justify-center
                          ${
                            showEmoji
                              ? "bg-transparent"
                              : week.backgroundColor
                              ? ""
                              : week.isHighlighted
                              ? "bg-black dark:bg-white"
                              : "bg-gray-200 dark:bg-gray-700"
                          }
                          ${week.isPlaceholder ? "opacity-0" : "opacity-100"}
                          ${week.isFuture ? "opacity-50" : ""}
                          ${
                            week.isCurrentWeek
                              ? "animate-[pulse_1s_ease-in-out_infinite]"
                              : ""
                          }
                        `}
                        style={weekStyle}
                        onClick={() =>
                          !week.isPlaceholder && handleWeekClick(week.date)
                        }
                      >
                        {showEmoji && (
                          <span
                            className="text-[18px] leading-none transform scale-50"
                            aria-hidden="true"
                          >
                            {week.emoji}
                          </span>
                        )}

                        <div
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 z-50 shadow-md pointer-events-none"
                          style={{ marginBottom: "0.25rem" }}
                        >
                          <div>Week of {format(week.date, "MMM d, yyyy")}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {isFuture(week.date)
                              ? `in ${formatDistanceToNow(week.date)}`
                              : `${formatDistanceToNow(week.date)} ago`}
                          </div>
                          {week.highlightTitle && (
                            <div className="font-bold mt-1">
                              {week.highlightTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="ml-2 w-48 flex-shrink-0">
                  <YearNote
                    year={year}
                    initialNote={data.note || ""}
                    onChange={handleYearNoteChange}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
