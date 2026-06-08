'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: '¿Cómo hago para pedir pastas?',
    answer:
      '¡Es muy fácil! Podés contactarnos por WhatsApp, email, redes sociales o mediante nuestro formulario web. Contanos qué productos y cantidades necesitás, y te confirmaremos la disponibilidad de stock o el tiempo estimado de elaboración.\n\nUna vez confirmado el pedido, solicitamos una seña mediante transferencia bancaria o Mercado Pago para reservarlo. El saldo restante se abona al momento de la entrega.',
  },
  {
    question: '¿Cuánto cuesta el envío?',
    answer:
      'El envío es gratuito dentro de la ciudad de Posadas.\n\nSi te encontrás en otra localidad, consultanos y evaluaremos la posibilidad de entrega según la ubicación, el volumen del pedido y la disponibilidad logística.',
  },
  {
    question: '¿Las pastas vienen frescas o congeladas?',
    answer:
      'Ofrecemos pastas frescas, ideales para cocinar y disfrutar en el momento, y también opciones freezadas para que puedas conservarlas por más tiempo.\n\nEn ambas presentaciones mantenemos la misma calidad, sabor y elaboración artesanal que nos caracteriza.',
  },
  {
    question: '¿Con cuánta anticipación debo realizar el pedido?',
    answer:
      'Recomendamos realizar los pedidos con al menos 24 a 48 horas de anticipación cuando se trate de productos sin stock disponible o de pedidos de gran volumen.\n\nDe esta manera podemos garantizar la frescura, la calidad y la dedicación que ponemos en cada elaboración.',
  },
  {
    question: '¿Qué medios de pago aceptan?',
    answer:
      'Aceptamos transferencias bancarias, Mercado Pago y efectivo.\n\nPara reservar el pedido solicitamos una seña previa mediante transferencia bancaria o Mercado Pago. El saldo restante puede abonarse al momento de la entrega.',
  },
  {
    question: '¿Cuentan con local físico?',
    answer:
      'Actualmente no contamos con atención en local físico. Elaboramos nuestros productos de manera artesanal y trabajamos principalmente por pedido.\n\nEsta modalidad nos permite mantener la frescura, la calidad de cada elaboración y una atención más personalizada.',
  },
  {
    question: '¿Realizan pedidos por cantidad?',
    answer:
      'Sí. Podemos elaborar pedidos de mayor volumen para reuniones familiares, instituciones, reventa y otras ocasiones especiales.\n\nTe recomendamos consultarnos con anticipación para confirmar disponibilidad, tiempos de elaboración y coordinación de entrega.',
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="min-h-screen flex flex-col justify-center py-12 sm:py-16 md:py-20 bg-crema">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-marron">
            Preguntas <span className="text-rojo">Frecuentes</span>
          </h2>
          <div className="h-1 w-20 bg-mostaza mx-auto mt-4 rounded-full" />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                  value={`faq-${index}`}
                  className="border-none"
                >
                  <AccordionTrigger className="text-lg font-bold text-marron hover:text-mostaza hover:no-underline text-left px-5 py-4 sm:px-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed px-5 pb-5 sm:px-6 sm:pb-6 whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
