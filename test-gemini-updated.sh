#!/bin/bash

# Script de verificación actualizado del Gemini Agent con modelo correcto
# Uso: ./test-gemini-updated.sh

echo "🚀 Verificación del Gemini Agent - Modelo Corregido"
echo "=================================================="

API_URL="http://localhost:3000/api/generate"

echo ""
echo "1️⃣ Probando análisis de texto:"
echo "------------------------------"

response=$(curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Qué es la inteligencia artificial?"}' \
  -s 2>/dev/null)

if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
  echo "$response" | jq '.'
else
  echo "❌ Error en análisis de texto"
fi

echo ""
echo ""
echo "2️⃣ Probando análisis de imagen:"
echo "--------------------------------"

response=$(curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Crea una imagen de un paisaje montañoso"}' \
  -s 2>/dev/null)

if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
  echo "$response" | jq '.'
else
  echo "❌ Error en análisis de imagen"
fi

echo ""
echo ""
echo "3️⃣ Probando generación de texto:"
echo "---------------------------------"

response=$(curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Qué es React?"}' \
  -s 2>/dev/null)

if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
  echo "$response" | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    preview: (.respuesta | .[0:80] + "...")
  }'
else
  echo "❌ Error en generación de texto"
fi

echo ""
echo ""
echo "4️⃣ Probando generación de imagen:"
echo "----------------------------------"

response=$(curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Un robot amigable en estilo cartoon"}' \
  -s 2>/dev/null)

if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
  echo "$response" | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    imageUrl: .respuesta
  }'
else
  echo "❌ Error en generación de imagen"
fi

echo ""
echo ""
echo "5️⃣ Probando petición mixta:"
echo "-----------------------------"

response=$(curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explica cómo funciona la fotosíntesis"}' \
  -s 2>/dev/null)

if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
  echo "$response" | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    preview: (.respuesta | .[0:80] + "...")
  }'
else
  echo "❌ Error en petición mixta"
fi

echo ""
echo "🎯 Verificación completada!"
echo ""
echo "📋 Resultados esperados:"
echo "- ✅ Texto: model='gemini-1.5-flash', type='text'"
echo "- ✅ Imagen: model='gemini-2.5-flash-image', type='image'"
echo "- ✅ URLs de S3 local válidas (localhost:9000) para imágenes"
echo "- ✅ Confianza > 0.6 para ambas"
echo "- ✅ Sin errores 404 o 500"
echo "- ✅ Configuración idéntica a upload.controller.ts"
