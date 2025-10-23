#!/usr/bin/env node

// Ejemplo de uso del Gemini Agent Inteligente desde Node.js
// Uso: node gemini-agent-example.js

const API_URL = 'http://localhost:3000/api/generate';

async function testGeminiAgent() {
  console.log('🧪 Probando Gemini Agent Inteligente desde Node.js');
  console.log('=================================================\n');

  // Ejemplos de peticiones para probar
  const testCases = [
    {
      name: 'Pregunta informativa',
      prompt: '¿Qué es la inteligencia artificial?',
      expectedType: 'text'
    },
    {
      name: 'Generación de imagen - Paisaje',
      prompt: 'Crea una imagen de un paisaje montañoso con un lago en el valle',
      expectedType: 'image',
      expectedModel: 'gemini-2.5-flash-image'
    },
    {
      name: 'Generación de imagen - Personaje',
      prompt: 'Un robot amigable en estilo cartoon con ojos brillantes',
      expectedType: 'image',
      expectedModel: 'gemini-2.5-flash-image'
    },
    {
      name: 'Descripción técnica',
      prompt: 'Explica cómo funciona el algoritmo de Dijkstra',
      expectedType: 'text'
    },
    {
      name: 'Arte visual abstracto',
      prompt: 'Imagina una explosión de colores representando la creatividad',
      expectedType: 'image',
      expectedModel: 'gemini-2.5-flash-image'
    },
    {
      name: 'Análisis de datos',
      prompt: '¿Cuáles son las ventajas de usar React sobre Vue?',
      expectedType: 'text'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Probando: ${testCase.name}`);
    console.log(`   Prompt: "${testCase.prompt}"`);
    console.log(`   Esperado: ${testCase.expectedType}`);
    console.log('   ─────────────────────────────────────');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: testCase.prompt })
      });

      if (!response.ok) {
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const result = await response.json();

      console.log(`   ✅ Detectado: ${result.metadata?.type || 'desconocido'}`);
      console.log(`   🎯 Confianza: ${(result.metadata?.confidence * 100).toFixed(1)}%`);
      console.log(`   🤖 Modelo: ${result.metadata?.model || 'desconocido'}`);
      console.log(`   💭 Razón: ${result.metadata?.reasoning || 'sin razón'}`);

      // Mostrar parte de la respuesta
      const preview = result.respuesta.substring(0, 100);
      console.log(`   📄 Respuesta: "${preview}${result.respuesta.length > 100 ? '...' : ''}"`);

      // Verificar si la detección fue correcta
      const detectedType = result.metadata?.type;
      const detectedModel = result.metadata?.model;
      const isCorrect = detectedType === testCase.expectedType;
      const modelCorrect = testCase.expectedModel ? detectedModel === testCase.expectedModel : true;

      console.log(`   ${isCorrect ? '✅' : '❌'} Detección ${isCorrect ? 'correcta' : 'incorrecta'}`);
      if (testCase.expectedModel) {
        console.log(`   ${modelCorrect ? '✅' : '❌'} Modelo ${modelCorrect ? 'correcto' : 'incorrecto'} (${detectedModel})`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log(''); // línea en blanco
  }

  console.log('🎉 Pruebas completadas!');
}

// Ejecutar las pruebas
testGeminiAgent().catch(console.error);
