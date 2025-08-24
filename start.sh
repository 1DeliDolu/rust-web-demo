#!/bin/bash
# Hem Rust API hem de Next.js web uygulamasını başlatır


# Başlatılacak servisleri docker-compose ile ayağa kaldır
echo "[DB] Docker compose ile veritabanı başlatılıyor..."
docker compose -f infra/docker-compose.yml up -d

# Veritabanı portu (host tarafında) - proje docker ayarına göre 3307 olarak maplenmiş
DB_HOST=localhost
DB_PORT=3307

echo "[DB] MySQL servisinin hazır olmasını bekliyorum: $DB_HOST:$DB_PORT"
MAX_RETRIES=30
RETRY=0
until nc -z $DB_HOST $DB_PORT; do
	RETRY=$((RETRY+1))
	if [ $RETRY -ge $MAX_RETRIES ]; then
		echo "[DB] MySQL portu $DB_HOST:$DB_PORT açılmadı, çıkılıyor."
		exit 1
	fi
	echo "[DB] Bekleniyor... ($RETRY/$MAX_RETRIES)"
	sleep 2
done
echo "[DB] MySQL portu hazır."

# API (Rust)
API_PORT=3001
is_port_open() {
	HOST=localhost
	PORT=$1
	if command -v nc >/dev/null 2>&1; then
		nc -z "$HOST" "$PORT" >/dev/null 2>&1
		return $?
	else
		ss -ltn "sport = :$PORT" >/dev/null 2>&1
		return $?
	fi
}

if is_port_open $API_PORT; then
	echo "[API] Port $API_PORT zaten kullanımda, yeni bir API başlatılmayacak."
	# try to find PID
	API_PID=$(pgrep -a shop-api | awk '{print $1}' | head -n1 || true)
	if [ -n "$API_PID" ]; then
		echo "[API] Bulunan PID: $API_PID"
	fi
else
	cd apps/api
	echo "[API] cargo run başlatılıyor..."
	cargo run &
	API_PID=$!
	cd ../..
fi

# Web (Next.js)
WEB_PORT=3000
if is_port_open $WEB_PORT; then
	echo "[Web] Port $WEB_PORT zaten kullanımda, yeni bir web sunucusu başlatılmayacak."
	WEB_PID=$(pgrep -f "next dev" | head -n1 || true)
	if [ -n "$WEB_PID" ]; then
		echo "[Web] Bulunan PID: $WEB_PID"
	fi
else
	cd apps/web
	echo "[Web] npm run dev başlatılıyor..."
	npm run dev &
	WEB_PID=$!
	cd ../..
fi

# PID'leri göster

echo "API PID: $API_PID"
echo "Web PID: $WEB_PID"

echo "Çıkmak için Ctrl+C yapabilirsiniz."

# Arka planda çalışan işlemleri bekle
wait $API_PID $WEB_PID
