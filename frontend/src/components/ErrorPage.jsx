import { XCircleIcon } from "@heroicons/react/24/solid";

const ErrorPage = ({ message }) => (
  <div className="flex items-center justify-center h-screen bg-red-50">
    <div className="p-8 bg-white rounded-xl shadow-lg border border-red-200 flex flex-col items-center">
      <XCircleIcon className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-red-600 mb-2">
        Oops! Something went wrong
      </h2>
      <p className="text-gray-700 text-center mb-4">
        {message || "An unexpected error occurred. Please try again later."}
      </p>
      <button
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        onClick={() => window.location.reload()}
      >
        Reload Page
      </button>
    </div>
  </div>
);

export default ErrorPage;
