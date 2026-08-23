import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resetAppCache } from '@/utils/resetAppCache';
import { RefreshCw } from 'lucide-react';

const AppSettings = () => (
	<Card variant="parchment">
		<CardHeader>
			<CardTitle className="flex items-center gap-2">
				<RefreshCw className="w-5 h-5" />
				App
			</CardTitle>
			<CardDescription>
				Sieht die Oberfläche kaputt aus oder fehlen Felder, hängt meist eine alte
				gespeicherte Fassung fest. Das hier holt alle Dateien frisch – Held, Talente
				und Historie bleiben erhalten.
			</CardDescription>
		</CardHeader>
		<CardContent className="space-y-3">
			<Button
				variant="secondary"
				size="lg"
				onClick={() => void resetAppCache()}
				className="w-full"
			>
				<RefreshCw className="w-5 h-5 mr-2" />
				App neu laden und Zwischenspeicher leeren
			</Button>
			<p className="text-sm text-muted-foreground">
				Version {__APP_VERSION__}
			</p>
		</CardContent>
	</Card>
);

export default AppSettings;
