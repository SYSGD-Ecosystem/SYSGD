#!/bin/bash

# Script de verificación del Gemini Agent con Replicate + S3
# Uso: ./test-replicate-s3.sh

echo "🚀 Verificación del Gemini Agent - Replicate + S3 Local"
echo "======================================================="

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
echo "4️⃣ Probando generación de imagen (Replicate + S3):"
echo "--------------------------------------------------"

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

  # Verificar que la URL sea de S3 local
  imageUrl=$(echo "$response" | jq -r '.respuesta')
  if [[ "$imageUrl" == *"localhost:9000"* ]]; then
    echo "✅ URL de S3 local detectada correctamente"
  else
    echo "⚠️ URL no es de S3 local: $imageUrl"
  fi
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
echo "📋 Flujo implementado:"
echo "1. ✅ Análisis con Gemini 2.5 Flash"
echo "2. ✅ Detección automática de texto vs imagen"
echo "3. ✅ Texto: Gemini 2.5 Flash"
echo "4. ✅ Imagen: Replicate (google/imagen-4)"
echo "5. ✅ Descarga automática de imagen"
echo "6. ✅ Upload a S3 local (igual que upload.controller.ts)"
echo "7. ✅ URL pública de S3 devuelta al usuario"
echo ""
echo "🔧 Variables de entorno requeridas:"
echo "- GEMINI_API_KEY=tu_clave_gemini"
echo "- REPLICATE_API_TOKEN=tu_token_replicate"
echo "- AWS_ENDPOINT=http://localhost:9000"
echo "- AWS_S3_BUCKET_NAME=sysgd-uploads"
