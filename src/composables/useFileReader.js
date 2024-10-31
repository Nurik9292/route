export const useFileReader = () => {
    const reader = new FileReader()
  
    const readAsDataUrl = (file, callback) => {
      reader.addEventListener('load', () => callback(reader.result))
      reader.readAsDataURL(file)
    }
  
    return {
      readAsDataUrl
    }
  }
  