export const secondsToHumanReadable = (total) => {
    total = Math.round(total)

    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total - hours * 3600) / 60)
    const seconds = total - hours * 3600 - minutes * 60

    const parts = []

    if (hours > 0) {
        parts.push(`${hours} hr`)
    }

    if (minutes > 0) {
        parts.push(`${minutes} min`)
    }

    if (seconds > 0 && hours < 1) {
        parts.push(`${seconds} sec`)
    }

    return parts.join(' ') || '0 sec'
}

export const secondsToHis = (total) => {
    total = Math.round(total)
    const parts = []

    const hours = Math.floor(total / 3600)

    if (hours > 0) {
        parts.push(hours.toString().padStart(2, '0'))
    }

    parts.push((Math.floor((total / 60) % 60)).toString().padStart(2, '0'))
    parts.push((total % 60).toString().padStart(2, '0'))

    return parts.join(':')
}

export const parseValidationError = (error) => {
    let messages = []

    Object.keys(error.errors).forEach(key => {
        messages = messages.concat(...error.errors[key])
    })

    return messages
}

export const br2nl = (str) => str ? str.replace(/<br\s*\/?>/gi, '\n') : ''

export const cr2lf = (str) => {
    const div = document.createElement('div')
    div.innerHTML = str
    return div.innerHTML
}

export const slugToTitle = (slug, separator = '-') => {
    let title = slug.split(separator).map(w => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()).join(' ')
    return title.replace(/\s+/g, ' ').trim()
}

export const pluralize = (count, singular) => {
    count = Array.isArray(count) ? count.length : (count ?? 0)
    return count === 1 ? `${count} ${singular}` : `${count.toLocaleString()} ${singular}s`
}
