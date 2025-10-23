#!/bin/bash

# Script de verificación rápida del Gemini Agent (modelos unificados)
# Uso: ./verify-gemini-agent.sh

echo "🔧 Verificando Gemini Agent (modelos unificados)"
echo "==============================================="

API_URL="http://localhost:3000/api/generate"

echo ""
echo "1️⃣ Verificando análisis de texto:"
echo "----------------------------------"

curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Qué es la inteligencia artificial?"}' \
  -s | jq '.'

echo ""
echo ""
echo "2️⃣ Verificando análisis de imagen:"
echo "-----------------------------------"

curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Crea una imagen de un paisaje montañoso"}' \
  -s | jq '.'

echo ""
echo ""
echo "3️⃣ Verificando generación automática (texto):"
echo "---------------------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Qué es React?"}' \
  -s | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    preview: (.respuesta | .[0:100] + "...")
  }'

echo ""
echo ""
echo "4️⃣ Verificando generación automática (imagen):"
echo "----------------------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Un robot amigable en estilo cartoon"}' \
  -s | jq '{
    type: .metadata.type,
    model: .metadata.model,
    confidence: .metadata.confidence,
    preview: (.respuesta | .[0:100] + "...")
  }'

echo ""
echo ""
echo "5️⃣ Verificando generación mixta:"
echo "---------------------------------"

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explica cómo funciona la fotosíntesis"}' \
  -s | jq '{
    type: .metadata.type,
    model: .metadata.model,
    preview: (.respuesta | .[0:100] + "...")

echo ""
echo "✅ Verificación completada!"
echo ""
echo "📋 Verifica que:"
echo "- El modelo detectado sea 'gemini-2.5-flash-image' para imágenes"
echo "- El modelo detectado sea 'gemini-1.5-flash' para texto"
echo "- La confianza sea alta (> 0.6)"
echo "- Las imágenes devuelvan URLs de S3 local válidas (localhost:9000)"
echo "- El tipo detectado sea correcto"
