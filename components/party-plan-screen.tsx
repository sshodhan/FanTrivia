'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PartyInfoToggle } from '@/components/party-info-toggle';

type PartyTab = 'welcome' | 'menu' | 'info';

interface PartyPlanScreenProps {
  onBack: () => void;
  onViewScoreboard: () => void;
}

const TABS: { id: PartyTab; label: string; emoji: string }[] = [
  { id: 'welcome', label: 'Welcome', emoji: '🎉' },
  { id: 'menu', label: 'Menu', emoji: '🍽️' },
  { id: 'info', label: 'Venue & Parking', emoji: '📍' },
];

export function PartyPlanScreen({ onBack, onViewScoreboard }: PartyPlanScreenProps) {
  const [activeTab, setActiveTab] = useState<PartyTab>('welcome');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-6 pb-3 text-center relative">
        <div className="absolute left-3 top-5">
          <PartyInfoToggle isActive={true} onToggle={onBack} />
        </div>
        <div className="text-4xl mb-1">🏈</div>
        <h1 className="font-[var(--font-heading)] text-2xl font-bold text-primary tracking-tight">
          GAME DAY PARTY
        </h1>
        <p className="text-secondary text-sm mt-1">Columbia Tower Club</p>
      </header>

      {/* Tab Navigation */}
      <div
        className="border-b-2 border-[#001B33] sticky top-0 z-[15] bg-[#002244]"
        role="tablist"
        aria-label="Party plan sections"
      >
        <div className="flex items-center">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-3 px-2 text-center relative transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive ? 'text-primary' : 'text-[#A5ACAF]'
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg" aria-hidden="true">{tab.emoji}</span>
                  <span className="text-xs font-bold">{tab.label}</span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(105,190,40,0.5)]" />
                )}
              </button>
            );
          })}
          <button
            onClick={onBack}
            className="px-3 py-3 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Close party info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'welcome' && <WelcomeTab onViewScoreboard={onViewScoreboard} />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'info' && <InfoTab />}
      </div>
    </div>
  );
}

/* ───────── Welcome Tab ───────── */
function WelcomeTab({ onViewScoreboard }: { onViewScoreboard: () => void }) {
  return (
    <div className="p-6 space-y-6">
      {/* Hero welcome & what to expect */}
      <div className="bg-card rounded-xl p-6 border border-primary/30">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">🎉🏈🎉</div>
          <h2 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
            Welcome, Friends!
          </h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Welcome to Super Bowl LX! The Seahawks are back on the biggest stage and we&apos;re watching it all from the 75th floor.
          </p>
          <p>
            Expect a DJ-powered pregame, chef-curated food stations running all game long, drink specials, raffles, and screens everywhere you look.
          </p>
          <p>
            Whether you&apos;re here to cheer on the 12s, catch the commercials, or vibe through halftime &mdash; this is your spot.
          </p>
          <p className="text-foreground font-medium pt-1">
            Grab a drink, load up a plate, jump into some trivia or a board game, and settle in. Go Hawks!
          </p>
        </div>
      </div>

      {/* Venue hero image */}
      <div className="rounded-xl overflow-hidden">
        <img
          src="https://exgvqiqvzwvzklqxwbnf.supabase.co/storage/v1/object/public/photos/venue-sign.jpg"
          alt="Columbia Tower Club"
          className="w-full h-44 object-cover"
        />
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🎶</div>
          <div className="font-bold text-foreground text-sm">DJ</div>
          <div className="text-xs text-muted-foreground">Kickoff hour</div>
        </div>
        <div className="bg-card rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🎟️</div>
          <div className="font-bold text-foreground text-sm">Raffles</div>
          <div className="text-xs text-muted-foreground">Throughout</div>
        </div>
        <button
          onClick={onViewScoreboard}
          className="bg-card rounded-xl p-4 text-center transition-all hover:bg-card/80 active:scale-[0.98]"
        >
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-foreground text-sm">Trivia</div>
          <div className="text-xs text-muted-foreground">Champions</div>
        </button>
      </div>

      {/* Board games */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3">
          Board Games Available
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Monopoly', 'Clue', 'Yahtzee', 'Trivial Pursuit', 'Pictionary'].map(game => (
            <span
              key={game}
              className="bg-primary/15 text-primary text-sm font-medium px-3 py-1.5 rounded-full border border-primary/30"
            >
              {game}
            </span>
          ))}
        </div>
      </div>

      {/* Champagne branding image */}
      <div className="rounded-xl overflow-hidden">
        <img
          src="https://exgvqiqvzwvzklqxwbnf.supabase.co/storage/v1/object/public/photos/champagne.jpg"
          alt="Columbia Tower Club"
          className="w-full h-44 object-cover"
        />
      </div>
    </div>
  );
}

/* ───────── Menu Tab ───────── */

interface MenuStation {
  name: string;
  emoji: string;
  items: { title: string; description?: string }[];
}

const MENU_STATIONS: MenuStation[] = [
  {
    name: 'Welcoming Spread',
    emoji: '🧀',
    items: [
      { title: 'Cheese and charcuterie' },
      { title: 'Crudite' },
      { title: 'Fruit platter' },
      { title: 'Fresh fried potato chips' },
      { title: 'Dips', description: 'Baba ghanoush, tzatziki, hummus, French onion' },
      { title: 'Olives, pickles, crackers, bread sticks' },
    ],
  },
  {
    name: 'Oyster Bar',
    emoji: '🦪',
    items: [
      { title: 'East Coast vs West Coast Oysters', description: '2 types of each, for as long as they last' },
      { title: 'Accompaniments', description: 'Mignonette, cocktail sauce, lemons, hot sauce' },
    ],
  },
  {
    name: 'New England Station',
    emoji: '🦞',
    items: [
      { title: 'New England Clam Chowder Cups', description: 'Dill oil, oyster cracker' },
      { title: 'Cape Cod Blue Crab Cakes', description: 'Old bay aioli' },
      { title: 'Lobster Rolls', description: 'Maine lobster, melted butter, mayo, celery salt, pickled celery, chive' },
      { title: 'Boston Baked Beans', description: 'Smoked pork belly, molasses, brown sugar' },
    ],
  },
  {
    name: 'Seattle Station',
    emoji: '🐟',
    items: [
      { title: 'Teriyaki Chicken Bao Buns', description: 'Jalapeno, cilantro, carrot and daikon pickle, gochujang teriyaki sauce' },
      { title: 'Cedar Plank Salmon & Rolls', description: 'Citrus and herb cured and roasted king salmon w/ rolls and orange fennel beurre blanc' },
      { title: 'Tuna Poke', description: 'Ahi tuna, Hamachi, yuzu shoyu ponzu, cucumber, seaweed, kimchi, pickled ginger, wasabi furikake' },
      { title: 'Seattle Dog', description: 'Assorted sausages and dogs, grilled jalapenos and onions, cream cheese, potato buns' },
    ],
  },
  {
    name: 'Tailgate',
    emoji: '🏟️',
    items: [
      { title: 'Buffalo & Honey Garlic Sriracha Wings' },
      { title: 'Teriyaki Chicken Bao Buns', description: 'Jalapeno, cilantro, carrot and daikon pickle, gochujang teriyaki sauce' },
      { title: 'Fries' },
      { title: 'Tots' },
      { title: 'Chicken Tenders', description: 'Plain with sauces on the side' },
      { title: 'Sauces', description: 'Ranch, red hot, ketchup, sweet chili sauce' },
    ],
  },
  {
    name: 'Plant Based Station',
    emoji: '🌱',
    items: [
      { title: 'BBQ Shiitake Bao Buns', description: 'Vegan kimchi, fermented chili tofu cream, basil, pickled carrot' },
      { title: 'Poke Bowl', description: 'Charred cucumber, edamame, hijiki, tofu, jalapeno, pineapple, scallion, ao nori, burnt lemon ponzu, pickled ginger, bubu arare' },
      { title: 'Mango Cakes', description: '4th quarter' },
      { title: 'Vegan Chili Dogs', description: 'Vegan chili, vegan dogs, potato buns, onions, jalapenos, mustard, ketchup, relish, vegan cream cheese, vegan cheese' },
      { title: 'Jackfruit Cakes', description: 'Old bay tofu sauce' },
    ],
  },
  {
    name: '4th Quarter Sweets',
    emoji: '🍰',
    items: [
      { title: 'Cookies' },
      { title: 'Brownies' },
      { title: 'Chocolate & Berry Beignets' },
      { title: 'Eclairs' },
      { title: 'Macarons' },
    ],
  },
  {
    name: 'Drinks',
    emoji: '🍹',
    items: [
      { title: 'Sodas', description: 'Included' },
      { title: 'Rainier', description: '$4' },
      { title: 'Bartender', description: 'In your room' },
    ],
  },
];

function MenuTab() {
  const [activePill, setActivePill] = useState<string>(MENU_STATIONS[0].name);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pillsRef = useRef<HTMLDivElement>(null);
  const pillButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const scrollToSection = (stationName: string) => {
    const section = sectionRefs.current[stationName];
    if (!section) return;

    isScrollingRef.current = true;
    setActivePill(stationName);

    // Scroll the pill into view within the horizontal nav
    const pillButton = pillButtonRefs.current[stationName];
    if (pillButton && pillsRef.current) {
      pillButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // Scroll the section into view within the menu content area
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Reset scrolling flag after animation
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const pillsHeight = pillsRef.current?.offsetHeight ?? 0;
      const containerTop = container.getBoundingClientRect().top;
      const offset = containerTop + pillsHeight + 20;

      let closest: string | null = null;
      let closestDistance = Infinity;

      for (const station of MENU_STATIONS) {
        const el = sectionRefs.current[station.name];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - offset);
        if (rect.top <= offset + 100 && distance < closestDistance) {
          closestDistance = distance;
          closest = station.name;
        }
      }

      if (closest && closest !== activePill) {
        setActivePill(closest);
        const pillButton = pillButtonRefs.current[closest];
        if (pillButton && pillsRef.current) {
          pillButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activePill]);

  return (
    <div ref={scrollContainerRef} className="flex flex-col h-full overflow-y-auto">
      {/* Sticky pill navigation */}
      <div
        ref={pillsRef}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3"
      >
        <nav
          role="navigation"
          aria-label="Menu categories"
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MENU_STATIONS.map(station => {
            const isActive = activePill === station.name;
            return (
              <button
                key={station.name}
                ref={el => { pillButtonRefs.current[station.name] = el; }}
                onClick={() => scrollToSection(station.name)}
                aria-label={`Jump to ${station.name} section`}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(105,190,40,0.3)]'
                    : 'bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground border border-border/50'
                )}
              >
                <span aria-hidden="true">{station.emoji}</span>
                <span>{station.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Description */}
      <div className="px-6 pt-4">
        <p className="text-muted-foreground text-sm text-center mb-4">
          Chef-curated action stations refreshed throughout the game
        </p>
      </div>

      {/* Menu sections */}
      <div className="px-6 pb-6 space-y-4">
        {MENU_STATIONS.map(station => (
          <div
            key={station.name}
            ref={el => { sectionRefs.current[station.name] = el; }}
            id={`menu-section-${station.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="bg-card rounded-xl overflow-hidden scroll-mt-16"
          >
            {/* Station header */}
            <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center gap-3">
              <span className="text-2xl">{station.emoji}</span>
              <h3 className="font-[var(--font-heading)] text-base font-bold text-primary">
                {station.name}
              </h3>
            </div>
            {/* Station items */}
            <div className="px-5 py-3 divide-y divide-border/50">
              {station.items.map((item, i) => (
                <div key={i} className="py-2.5 first:pt-1 last:pb-1">
                  <div className="font-semibold text-foreground text-sm">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Info / Venue & Parking Tab ───────── */
function InfoTab() {
  return (
    <div className="p-6 space-y-5">
      {/* Party Kick Off card */}
      <div className="bg-card rounded-xl p-5 border border-primary/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎉</span>
          </div>
          <div>
            <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary">
              Party Kick Off
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-foreground font-medium">Start Time:</span> 1:30 PM PST, Feb 8th
              </li>
              <li className="flex gap-2">
                <span className="text-foreground font-medium">Reservation:</span> Naomi Akiko
              </li>
              <li className="flex gap-2">
                <span className="text-foreground font-medium">Party Floor:</span> 75th &mdash; Top floor
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Venue card */}
      <div className="bg-card rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏢</span>
          </div>
          <div>
            <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary">
              Columbia Tower Club
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              701 5th Ave, 75th Floor<br />
              Seattle, WA 98104
            </p>
          </div>
        </div>
      </div>

      {/* Parking */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3 flex items-center gap-2">
          <span className="text-xl">🅿️</span> Parking
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            The Columbia Center parking garage is accessible from 4th or 5th Avenue. Weekend and evening rates are typically reduced. Street parking is also available in the surrounding blocks.
          </p>
          <p>
            Ride-share drop-off is recommended at the 5th Avenue main entrance.
          </p>
        </div>
      </div>

      {/* Getting there */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3 flex items-center gap-2">
          <span className="text-xl">🚪</span> Getting In
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Enter through the main lobby at 701 5th Avenue. Take the elevators to the 75th floor. The Columbia Tower Club is at the top of the building with panoramic views of Seattle, the Cascades, and the Olympics.
          </p>
        </div>
      </div>

      {/* Views / nearby */}
      <div className="bg-card rounded-xl overflow-hidden">
        <img
          src="https://exgvqiqvzwvzklqxwbnf.supabase.co/storage/v1/object/public/photos/lumen-field.png"
          alt="Aerial view of Lumen Field from Columbia Tower Club"
          className="w-full h-44 object-cover"
        />
        <div className="p-5">
          <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3 flex items-center gap-2">
            <span className="text-xl">🏟️</span> Nearby
          </h3>
          <p className="text-sm text-muted-foreground">
            Located in the heart of downtown Seattle with views of Lumen Field, T-Mobile Park, Elliott Bay, and the city skyline from the 75th floor.
          </p>
        </div>
      </div>
    </div>
  );
}
