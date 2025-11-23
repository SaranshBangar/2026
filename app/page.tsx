"use client";

import AnimatedList from "@/components/AnimatedList";
import { Volume2, VolumeX, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCountryForTimezone, getAllTimezones } from "countries-and-timezones";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [timeZones, setTimeZones] = useState<string[]>([]);
  const [filteredTimeZones, setFilteredTimeZones] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSelectedTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const allTimezones = getAllTimezones();
    const timezoneList = Object.keys(allTimezones).sort((a, b) => {
      const countryA = getCountryForTimezone(a)?.name || a;
      const countryB = getCountryForTimezone(b)?.name || b;
      return countryA.localeCompare(countryB);
    });
    setTimeZones(timezoneList);
    setFilteredTimeZones(timezoneList);

    audioRef.current = new Audio("/audio.mp3");
    audioRef.current.loop = true;

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log("Autoplay prevented", error);
          setIsPlaying(false);
        });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredTimeZones(timeZones);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = timeZones.filter((tz) => {
      const country = getCountryForTimezone(tz);
      const countryName = country?.name || "";
      return tz.toLowerCase().includes(lowerQuery) || countryName.toLowerCase().includes(lowerQuery);
    });
    setFilteredTimeZones(filtered);
  }, [searchQuery, timeZones]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getDisplayName = (tz: string) => {
    const country = getCountryForTimezone(tz);
    if (country) {
      const city = tz.split("/").pop()?.replace(/_/g, " ");
      return `${country.name} (${city})`;
    }
    return tz.split("/").pop()?.replace(/_/g, " ") || tz;
  };

  useEffect(() => {
    if (!selectedTimeZone) return;

    const calculateTimeLeft = () => {
      try {
        const now = new Date();
        const nowInTzStr = now.toLocaleString("en-US", {
          timeZone: selectedTimeZone,
        });
        const nowInTz = new Date(nowInTzStr);
        const targetInTz = new Date("1/1/2026, 12:00:00 AM");

        const difference = targetInTz.getTime() - nowInTz.getTime();

        if (difference <= 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      } catch (e) {
        console.error(e);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedTimeZone]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-foreground text-background overflow-hidden">
      <div className="absolute top-4 right-4 z-50 flex items-start gap-2 md:gap-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors"
          >
            <span className="max-w-[100px] truncate md:max-w-[200px]">{selectedTimeZone ? getDisplayName(selectedTimeZone) : "Select Timezone"}</span>
            {selectedTimeZone && getCountryForTimezone(selectedTimeZone)?.id && (
              <img
                src={`https://flagsapi.com/${getCountryForTimezone(selectedTimeZone)?.id}/flat/64.png`}
                alt={getCountryForTimezone(selectedTimeZone)?.id}
                className="h-5 w-5 object-contain shrink-0"
              />
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-card p-2 shadow-lg z-50">
              <div className="mb-2 px-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground" />
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border bg-background text-foreground py-2 pl-8 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
              </div>
              <AnimatedList
                items={filteredTimeZones}
                onItemSelect={(item) => {
                  setSelectedTimeZone(item);
                  setIsDropdownOpen(false);
                  setSearchQuery("");
                }}
                itemClassName="text-sm p-2 hover:bg-accent rounded-md cursor-pointer"
                renderItem={(item, index, isSelected) => {
                  const country = getCountryForTimezone(item);
                  const countryCode = country?.id;
                  return (
                    <div className="flex items-center gap-2 text-foreground">
                      {countryCode && (
                        <img src={`https://flagsapi.com/${countryCode}/flat/64.png`} alt={countryCode} className="h-5 w-5 object-contain shrink-0" />
                      )}
                      <span className="truncate">{getDisplayName(item)}</span>
                    </div>
                  );
                }}
              />
            </div>
          )}
        </div>

        <button
          onClick={toggleAudio}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors"
        >
          {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-4xl font-bold md:text-6xl">
        <div className="flex flex-col items-center">
          <span className="tabular-nums">{timeLeft.days}</span>
          <span className="text-sm font-normal text-muted-foreground md:text-base">days</span>
        </div>
        <span className="pb-6">:</span>
        <div className="flex flex-col items-center">
          <span className="tabular-nums">{timeLeft.hours.toString().padStart(2, "0")}</span>
          <span className="text-sm font-normal text-muted-foreground md:text-base">hrs</span>
        </div>
        <span className="pb-6">:</span>
        <div className="flex flex-col items-center">
          <span className="tabular-nums">{timeLeft.minutes.toString().padStart(2, "0")}</span>
          <span className="text-sm font-normal text-muted-foreground md:text-base">mins</span>
        </div>
        <span className="pb-6">:</span>
        <div className="flex flex-col items-center">
          <span className="tabular-nums">{timeLeft.seconds.toString().padStart(2, "0")}</span>
          <span className="text-sm font-normal text-muted-foreground md:text-base">seconds</span>
        </div>
      </div>
    </main>
  );
}
