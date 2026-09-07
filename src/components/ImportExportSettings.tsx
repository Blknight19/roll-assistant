import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ConfirmDialog from './ConfirmDialog';
import { exportCharacter } from '@/utils/exportCharacter';
import { importCharacter } from '@/utils/importCharacter';
import { resetLocalStorage } from '@/utils/resetLocalStorage';
import { AlertTriangle, Check, Download, Trash2, Upload } from 'lucide-react';

const ImportExportSettings = () => {
	const fileInput = useRef<HTMLInputElement>(null);
	const [importedName, setImportedName] = useState<string | null>(null);
	const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

	const handleFileSelected = async (input: HTMLInputElement) => {
		const file = input.files?.[0];
		// Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann – sonst
		// feuert `change` beim zweiten Mal nicht.
		input.value = '';
		if (!file) return;

		const imported = await importCharacter(file);
		setImportedName(imported ? file.name : null);
	};

	return (
		<div className="space-y-6">
			{/* Export */}
			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Download className="w-5 h-5" />
						Charakter Exportieren
					</CardTitle>
					<CardDescription>
						Sichere deinen Charakter als .held-Datei. Der Inhalt ist nur kodiert,
						nicht verschlüsselt. Wer die Datei hat, kann sie lesen.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button 
						onClick={exportCharacter}
						variant="parchment"
						size="lg"
						className="w-full"
					>
						<Download className="w-5 h-5 mr-2" />
						Charakter exportieren
					</Button>
				</CardContent>
			</Card>

			{/* Import */}
			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Upload className="w-5 h-5" />
						Charakter Importieren
					</CardTitle>
					<CardDescription>
						Lade einen gespeicherten Charakter
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<input
						ref={fileInput}
						type="file"
						accept=".held,.dsa"
						className="hidden"
						onChange={(e) => handleFileSelected(e.currentTarget)}
					/>

					<Button 
						variant="secondary" 
						size="lg"
						onClick={() => fileInput.current?.click()}
						className="w-full"
					>
						<Upload className="w-5 h-5 mr-2" />
						Charakter importieren
					</Button>

					{importedName && (
						<div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success text-sm">
							<Check className="w-4 h-4 shrink-0 text-success-dark dark:text-success-light" />
							<span className="text-muted-foreground">
								<span className="font-semibold text-success-dark dark:text-success-light">
									Import erfolgreich
								</span>
								{' – '}{importedName}
							</span>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card variant="failure" className="border-2">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-failure-dark dark:text-failure-light">
						<AlertTriangle className="w-5 h-5" />
						Danger Zone
					</CardTitle>
					<CardDescription className="text-failure-dark dark:text-failure-light">
						Diese Aktion kann nicht rückgängig gemacht werden!
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="destructive"
						size="lg"
						onClick={() => setResetConfirmOpen(true)}
						className="w-full"
					>
						<Trash2 className="w-5 h-5 mr-2" />
						Alle Daten zurücksetzen
					</Button>
					<ConfirmDialog
						open={resetConfirmOpen}
						onOpenChange={setResetConfirmOpen}
						title="Alle Daten zurücksetzen?"
						description="Charakter, Talente, Kampfwerte und Historie werden unwiderruflich gelöscht."
						confirmLabel="Alles löschen"
						onConfirm={resetLocalStorage}
					/>
				</CardContent>
			</Card>
		</div>
	);
};

export default ImportExportSettings;