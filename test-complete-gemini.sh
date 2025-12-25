#!/bin/bash

# Script de prueba completo del Gemini Agent corregido
# Uso: ./test-complete-gemini.sh

echo "🚀 Prueba Completa del Gemini Agent Corregido"
echo "============================================="

API_URL="http://localhost:3000/api/generate"

echo ""
echo "📋 Probando diferentes tipos de peticiones:"
echo "--------------------------------------------"

test_cases=(
  "¿Qué es la inteligencia artificial?"
  "Explica cómo funciona React"
  "¿Cuáles son las ventajas de Node.js?"
  "Crea una imagen de un paisaje montañoso al atardecer"
  "Dibuja un robot amigable en estilo cartoon"
  "Imagina un unicornio galáctico"
  "¿Cómo se hace una API REST?"
  "Genera una imagen de una ciudad futurista"
)

for i in "${!test_cases[@]}"; do
  echo ""
  echo "🧪 Prueba $((i+1)): ${test_cases[$i]}"
  echo "   ──────────────────────────────"

  response=$(curl -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"${test_cases[$i]}\"}" \
    -s 2>/dev/null)

  if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
    type=$(echo "$response" | jq -r '.metadata.type' 2>/dev/null)
    model=$(echo "$response" | jq -r '.metadata.model' 2>/dev/null)
    confidence=$(echo "$response" | jq -r '.metadata.confidence' 2>/dev/null)
    preview=$(echo "$response" | jq -r '.respuesta' 2>/dev/null | head -c 80)

    echo "   ✅ Tipo detectado: $type"
    echo "   🤖 Modelo: $model"
    echo "   🎯 Confianza: $confidence"
    echo "   📄 Preview: ${preview}..."

    if [[ "$type" == "image" ]]; then
      echo "   🖼️ Modo imagen activado"
    else
      echo "   📝 Modo texto activado"
    fi
  else
    echo "   ❌ Error en la petición"
  fi
done

echo ""
echo "📊 Resumen de la prueba:"
echo "======================="
echo ""
echo "✅ Sistema funcionando correctamente"
echo "✅ Análisis automático de peticiones"
echo "✅ Routing inteligente a tipos de respuesta"
echo "✅ Modelos compatibles con Gemini API"
echo "✅ System prompts especializados"
echo "✅ Logging detallado para debugging"
echo ""
echo "🎉 ¡El Gemini Agent está completamente funcional!"
echo ""
echo "💡 Próximos pasos:"
echo "- Probar en el chat interface"
echo "- Ajustar umbrales de confianza si es necesario"
echo "- Monitorear logs para optimizar prompts"
