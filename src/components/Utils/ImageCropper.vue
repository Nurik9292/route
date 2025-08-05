<template>
    <div class="w-full h-full fixed top-0 left-0 flex items-center justify-center z-[99] bg-black/70">
        <div class="relative max-w-full max-h-full rounded-md flex">
            <Cropper
                ref="cropper"
                class="cropper"
                image-restriction="stencil"
                :src="source"
                :auto-zoom="config.autoZoom"


                :stencil-props="{
                  aspectRatio: 1/1,
                  movable: true,
                  resizable: true
                  }"

                :canvas="{
                  maxWidth: config.maxWidth,
                  maxHeight: config.maxHeight,
                  fillColor: '#ffffff'
                }"

                @ready="onReady"
             />
            <div class="fixed top-6 right-6 flex flex-1 gap-2">
                <BtnComponent success @click.prevent="cropImage">✂️ Обрезать</BtnComponent>
                <BtnComponent transparent @click.prevent="cancel">❌ Отмена</BtnComponent>
            </div>
          <div class="quality-controls">
            <label>Качество JPEG:</label>
            <input
                v-model="jpegQuality"
                type="range"
                min="0.3"
                max="1"
                step="0.1"
                class="quality-slider"
            />
            <span>{{ Math.round(jpegQuality * 100) }}%</span>
          </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
    name: 'ImageCropper',

    components: {
        Cropper,
        BtnComponent
    },

    props: {
        source: {
            type: String,
            default: null
        },
        config: {
            type: Object,
            default: () => ({
                minWidth: 400,
                maxHeight: 400,
                autoZoom: true,
            })
        }
    },


    data() {
        return {
          ready: false,
          jpegQuality: 0.8
        }
    },
    methods: {
      onReady() {
        this.ready = true
        console.log('🎯 Cropper готов к использованию')
      },

      cropImage() {
        const cropper = this.$refs.cropper
        if (!cropper) return

        console.log('🔧 Начинаем обрезку изображения...')

        // ✅ ПРАВИЛЬНАЯ НАСТРОЙКА: получаем Canvas с оптимальными параметрами
        const canvas = cropper.getCanvas({
          width: 400,           // Ограничиваем размер
          height: 400,          // Ограничиваем размер
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high'
        })

        if (!canvas) {
          console.error('❌ Не удалось получить canvas')
          return
        }

        // ✅ ДИАГНОСТИКА Canvas
        console.log('📐 Canvas параметры:', {
          width: canvas.width,
          height: canvas.height,
          totalPixels: canvas.width * canvas.height,
          uncompressedSizeMB: (canvas.width * canvas.height * 4 / 1024 / 1024).toFixed(2) + ' MB'
        })

        // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Экспорт в JPEG с качеством
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', this.jpegQuality)

        // ✅ ДИАГНОСТИКА результата
        const sizeKB = Math.round(optimizedDataUrl.length / 1024)
        const sizeMB = (optimizedDataUrl.length / 1024 / 1024).toFixed(2)

        console.log('✅ Результат оптимизации:', {
          format: 'JPEG',
          quality: Math.round(this.jpegQuality * 100) + '%',
          sizeKB: sizeKB + ' KB',
          sizeMB: sizeMB + ' MB',
          acceptable: sizeKB < 500 ? '✅ Отличный размер' :
              sizeKB < 1000 ? '⚠️ Большой, но приемлемый' :
                  '❌ Слишком большой'
        })

        let finalDataUrl = optimizedDataUrl
        if (optimizedDataUrl.length > 1_000_000) { // Если больше 1MB
          console.warn('⚠️ Размер все еще большой, применяем дополнительное сжатие...')
          finalDataUrl = canvas.toDataURL('image/jpeg', 0.6) // Снижаем качество

          const newSizeKB = Math.round(finalDataUrl.length / 1024)
          console.log('🔄 После дополнительного сжатия:', {
            quality: '60%',
            sizeKB: newSizeKB + ' KB'
          })
        }

        // Отправляем результат
        this.$emit('crop', finalDataUrl)
      },

      smartOptimize(canvas, targetSizeKB = 400) {
        let quality = 0.9
        let dataUrl
        let attempts = 0
        const maxAttempts = 5

        console.log(`🤖 Умная оптимизация: цель ${targetSizeKB} KB`)

        do {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
          const currentSizeKB = Math.round(dataUrl.length / 1024)

          console.log(`   Попытка ${attempts + 1}: качество ${Math.round(quality * 100)}% = ${currentSizeKB} KB`)

          if (currentSizeKB <= targetSizeKB) {
            console.log(`✅ Достигнута цель: ${currentSizeKB} KB`)
            break
          }

          quality -= 0.15 // Уменьшаем качество на 15%
          attempts++

        } while (quality > 0.2 && attempts < maxAttempts)

        return dataUrl
      },


      cancel() {
        this.$emit('cancel')
      },
    }
}
</script>

<style scoped>
.cropper {
	height: 600px;
	width: 600px;
	background: #DDD;
}
</style>