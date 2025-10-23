#!/bin/bash

# Script de prueba para el Gemini Agent Inteligente
# Uso: ./test-gemini-agent.sh

echo "🧪 Probando Gemini Agent Inteligente"
echo "====================================="

API_URL="http://localhost:3000/api/generate"
AUTH_TOKEN="tu-token-de-autenticacion-aqui"

echo ""
echo "1️⃣ Probando análisis de petición de texto:"
echo "----------------------------------------"

curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "¿Qué es la inteligencia artificial?"}' \
  -s | jq '.'

echo ""
echo ""
echo "2️⃣ Probando análisis de petición de imagen:"
echo "-------------------------------------------"

curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Crea una imagen de un paisaje montañoso al atardecer"}' \
  -s | jq '.'

echo ""
echo ""
echo "3️⃣ Probando respuesta automática (texto):"
echo "-----------------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "¿Qué es React?"}' \
  -s | jq '.'

echo ""
echo ""
echo "4️⃣ Probando respuesta automática (imagen):"
echo "------------------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Dibuja un robot amigable en estilo cartoon"}' \
  -s | jq '.'

echo ""
echo ""
echo "5️⃣ Probando petición ambigua:"
echo "------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Explica cómo funciona una cámara digital"}' \
  -s | jq '.'

echo ""
echo "✨ Pruebas completadas!"
echo ""
echo "📝 Notas:"
echo "- Reemplaza 'tu-token-de-autenticacion-aqui' con un token válido"
echo "- Asegúrate de que el servidor esté corriendo en puerto 3000"
echo "- Los resultados muestran el tipo detectado y la confianza del análisis"
