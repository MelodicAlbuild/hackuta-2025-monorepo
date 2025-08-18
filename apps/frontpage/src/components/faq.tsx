import faqJson from "../../faq.json";

export default function Faq() {
  return (
    <>
      {faqJson.map((faq) => (
        <div
          className="accordion py-8 border-b border-solid border-gray-200 "
          id="basic-heading-two-with-arrow-always-open"
          key={faq.id}
        >
          <div className="group inline-flex items-center justify-between font-normal text-2xl leading-8 text-white w-full transition duration-500 hover:text-indigo-600">
            <h5>{faq.label}</h5>
            <svg
              className="text-white transition duration-500 group-hover:text-indigo-600 accordion-active:text-indigo-600 accordion-active:rotate-180"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.5 8.25L12.4142 12.3358C11.7475 13.0025 11.4142 13.3358 11 13.3358C10.5858 13.3358 10.2525 13.0025 9.58579 12.3358L5.5 8.25"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
          <div
            id="basic-collapse-two-with-arrow-always-open"
            className="accordion-content w-full px-0 overflow-hidden pr-4"
            aria-labelledby="basic-heading-two-with-arrow-always-open"
          >
            <p className="font-franklinGothic text-base text-white font-normal text-xl text-left">{faq.content}</p>
          </div>
        </div>
      ))}
    </>
  );
}
