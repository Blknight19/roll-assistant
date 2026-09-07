import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

const ThemeToggle = () => {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState<boolean>(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	return (
		<Button
			onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
			variant="ghost"
			size="icon"
			className="rounded-full hover:bg-parchment-200 dark:hover:bg-parchment-700"
			aria-label='Theme wechseln'
		>
			{resolvedTheme === 'dark' ? (
				<Moon className="w-5 h-5 text-parchment-400" />
			) : (
				<Sun className="w-5 h-5 text-parchment-600" />
			)}
		</Button>
	);
};

export default ThemeToggle;
