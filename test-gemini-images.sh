#!/bin/bash

# Script de prueba para el modelo de imágenes de Gemini
# Uso: ./test-gemini-images.sh

echo "🖼️ Probando Modelo de Imágenes de Gemini"
echo "======================================="

API_URL="http://localhost:3000/api/generate"
AUTH_TOKEN="tu-token-de-autenticacion-aqui"

echo ""
echo "1️⃣ Probando generación de imagen - Paisaje:"
echo "-------------------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Un paisaje montañoso al atardecer con un lago cristalino en el valle"}' \
  -s | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    reasoning: .metadata.reasoning,
    preview: (.respuesta | .[0:200] + "...")
  }'

echo ""
echo ""
echo "2️⃣ Probando generación de imagen - Personaje:"
echo "---------------------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Un robot amigable con ojos brillantes en estilo cartoon, fondo de ciudad futurista"}' \
  -s | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    reasoning: .metadata.reasoning,
    preview: (.respuesta | .[0:200] + "...")
  }'

echo ""
echo ""
echo "3️⃣ Probando generación de imagen - Abstracto:"
echo "---------------------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Una explosión de colores abstractos representando la creatividad y la innovación"}' \
  -s | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    reasoning: .metadata.reasoning,
    preview: (.respuesta | .[0:200] + "...")
  }'

echo ""
echo ""
echo "4️⃣ Probando análisis de cada petición:"
echo "---------------------------------------"

echo "Análisis del paisaje:"
curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Un paisaje montañoso al atardecer con un lago cristalino en el valle"}' \
  -s | jq '.'

echo ""
echo "Análisis del robot:"
curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$AUTH_TOKEN" \
  -d '{"prompt": "Un robot amigable con ojos brillantes en estilo cartoon"}' \
  -s | jq '.'

echo ""
echo "✨ Pruebas de imágenes completadas!"
echo ""
echo "📝 Verifica que:"
echo "- El modelo detectado sea 'gemini-1.5-flash (image mode)'"
echo "- La confianza sea alta (> 0.8)"
echo "- Las descripciones sean detalladas y específicas"
echo "- El tipo detectado sea 'image'"
