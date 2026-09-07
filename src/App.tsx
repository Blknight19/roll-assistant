import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import TalentRoll from './components/TalentRoll';
import CastingTab from './components/CastingTab';
import SimpleRoll from './components/SimpleRoll';
import RollHistory from './components/RollHistory';
import ThemeToggle from './components/ThemeToggle';
import SettingsDialog from './components/SettingsDialog';
import Character from './components/Character';
import Combat from './components/Combat';
import HeroBar from './components/HeroBar';
import { useCastingDomains } from '@/hooks/useCastingDomains';
import { Scroll, Dices, History, User, Swords, Wand2 } from 'lucide-react';

// Talent und Kampf stehen bewusst nebeneinander – dazwischen wird am Tisch am
// häufigsten gewechselt. Der Wirken-Slot sitzt daneben, weil Zauberer und Geweihte
// zwischen Wirken und Kampf genauso oft springen. Label und Icon des Slots liefert
// `useCastingDomains`; `Wand2` steht hier nur als Platzhalter.
const allTabs = [
  { value: 'talentRoll', label: 'Talent', icon: Scroll },
  { value: 'combat', label: 'Kampf', icon: Swords },
  { value: 'casting', label: 'Magie', icon: Wand2, casting: true },
  { value: 'simpleRoll', label: 'Einzel', icon: Dices },
  { value: 'history', label: 'Historie', icon: History },
  { value: 'character', label: 'Held', icon: User },
];

function App() {
  const domains = useCastingDomains();
  const tabs = allTabs
    .filter(entry => !entry.casting || domains.any)
    .map(entry => entry.casting
      ? { ...entry, label: domains.tabLabel, icon: domains.icon }
      : entry);

  const [tab, setTab] = useState('talentRoll');

  // Der Wirken-Slot kann verschwinden, während er offen ist.
  useEffect(() => {
    if (!domains.any && tab === 'casting') setTab('talentRoll');
  }, [domains.any, tab]);

  return (
    <>
      {/* Parchment Gradient Background */}
      <div className='min-h-screen bg-parchment-gradient p-4 flex flex-col'>

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b border-parchment-400 dark:border-parchment-600 mb-6 -mx-4 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <Swords className="w-8 h-8 text-parchment-600 dark:text-parchment-300" />
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-parchment-700 dark:text-parchment-200">
                  Roll-Assistent
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <SettingsDialog />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto flex-1 flex flex-col items-center">
          <div className='w-full max-w-6xl'>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList
                className={`grid w-full ${domains.any ? 'grid-cols-6' : 'grid-cols-5'} h-auto mb-4 bg-parchment-100 dark:bg-parchment-800`}
              >
                {tabs.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="font-heading flex flex-col items-center gap-1 py-2"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] sm:text-xs leading-none">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <HeroBar />

              <TabsContent value="talentRoll" className="mt-0">
                <TalentRoll />
              </TabsContent>
              <TabsContent value="combat" className="mt-0">
                <Combat />
              </TabsContent>
              {domains.any && (
                <TabsContent value="casting" className="mt-0">
                  <CastingTab />
                </TabsContent>
              )}
              <TabsContent value="simpleRoll" className="mt-0">
                <SimpleRoll />
              </TabsContent>
              <TabsContent value="history" className="mt-0">
                <RollHistory />
              </TabsContent>
              <TabsContent value="character" className="mt-0">
                <Character />
              </TabsContent>
            </Tabs>
          </div>
        </main>

      </div>

      <Toaster />
    </>
  );
}

export default App;
