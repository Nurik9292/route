import { arrow, autoUpdate, offset } from '@floating-ui/dom'
import { updateFloatingUi } from '@/utils'

const getOrCreateTooltip = (el) => {
    if (el.$tooltip) return el.$tooltip

    el.$tooltip = document.createElement('div')
    el.$tooltip.classList.add('tooltip')

    const arrowElement = document.createElement('div')
    arrowElement.classList.add('tooltip-arrow')

    const content = document.createElement('div')
    content.classList.add('tooltip-content')

    el.$tooltip.appendChild(content)
    el.$tooltip.appendChild(arrowElement)

    document.body.appendChild(el.$tooltip)

    return el.$tooltip
}

const init = (el, binding) => {
    const $tooltip = getOrCreateTooltip(el)

    $tooltip.querySelector('.tooltip-content').innerText = binding.value
        || el.title
        || el.getAttribute('data-title')
        || el.innerText

    if (el.title && !el.getAttribute('data-title')) {
        el.setAttribute('data-title', el.title)
        el.removeAttribute('title')
    }

    const $arrow = $tooltip.querySelector('.tooltip-arrow')

    let placement = 'bottom'

    ['left', 'right', 'top', 'bottom'].forEach(p => {
        if (binding.modifiers[p]) {
            placement = p
        }
    })

    const update = async () => await updateFloatingUi(el, $tooltip, {
        placement,
        middleware: [
            arrow({ element: $arrow }),
            offset(8)
        ]
    }, $arrow)

    el.$cleanup = el.$cleanup || autoUpdate(el, $tooltip, update)

    const showTooltip = async () => {
        $tooltip.classList.add('show')
        await update()
    }

    const hideTooltip = () => $tooltip.classList.remove('show')

    el.addEventListener('mouseenter', showTooltip)
    el.addEventListener('focus', showTooltip)
    el.addEventListener('mouseleave', hideTooltip)
    el.addEventListener('blur', hideTooltip)
}

export default {
    mounted: init,
    updated: init,

    beforeUnmount: (el) => {
        el.$cleanup && el.$cleanup()
        el.$tooltip && document.body.removeChild(el.$tooltip)
    },

    name: 'tooltop'
}
