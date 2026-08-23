import { useState } from 'react';
import {
	Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import HeroSettings from './HeroSettings';
import RulesSettings from './RulesSettings';
import ImportExportSettings from './ImportExportSettings';
import AppSettings from './AppSettings';
import { Settings } from 'lucide-react';

const SettingsDialog = () => {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Einstellungen öffnen">
					<Settings className="h-5 w-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="font-heading">Einstellungen</DialogTitle>
				</DialogHeader>
				<div className="space-y-6">
					<HeroSettings />
					<RulesSettings />
					<ImportExportSettings />
					<AppSettings />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SettingsDialog;
