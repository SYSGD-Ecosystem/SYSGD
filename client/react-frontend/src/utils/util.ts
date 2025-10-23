

export const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Havana', // o la zona horaria que necesites
  });
};

export const formatSimpleDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Havana', // o la zona horaria que necesites
  });
};

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "destructive";
      case "Media":
        return "default";
      case "Baja":
        return "secondary";
      default:
        return "default";
    }
  };

export function timeAgo(dateString: string): string {
	const date = new Date(dateString);
	const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
	const intervals = [
		{ label: "año", seconds: 31536000 },
		{ label: "mes", seconds: 2592000 },
		{ label: "día", seconds: 86400 },
		{ label: "hora", seconds: 3600 },
		{ label: "minuto", seconds: 60 },
		{ label: "segundo", seconds: 1 },
	];

	for (const i of intervals) {
		const count = Math.floor(seconds / i.seconds);
		if (count > 0) {
			return `Hace ${count} ${i.label}${count !== 1 ? "s" : ""}`;
		}
	}
	return "Justo ahora";
}

export function getRandomEmoji() {
  const emojis = [
    "😀", "😎", "🤖", "👽", "🐱", "🐶", "🐵", "🦊", "🐸", "🐼",
    "🐧", "🐙", "🐢", "🐝", "🐳", "🌵", "🌈", "🔥", "⚡", "🍕",
    "🍔", "🍩", "🍉", "🍒", "🥑", "🚀", "🎮", "🎨", "🎧", "💡",
    "💎", "🧠", "👾", "🤡", "🦄", "🐉", "🦕", "🦖", "🥷", "🦸‍♂️"
  ];

  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}