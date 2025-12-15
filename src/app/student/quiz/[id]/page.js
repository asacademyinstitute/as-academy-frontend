'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { quizAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function QuizTakeContent() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuiz();
    }, [params.id]);

    const fetchQuiz = async () => {
        try {
            const response = await quizAPI.getById(params.id);
            setQuiz(response.data.data);
        } catch (error) {
            console.error('Error fetching quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            if (!confirm('You haven\'t answered all questions. Submit anyway?')) {
                return;
            }
        }

        setSubmitting(true);
        try {
            const response = await quizAPI.submit(params.id, answers);
            setResult(response.data.data);
        } catch (error) {
            alert('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="min-h-screen bg-background dark:bg-gray-950 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
                    <div className="text-center">
                        <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${result.passed ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            {result.passed ? (
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {result.passed ? 'Congratulations!' : 'Keep Trying!'}
                        </h2>

                        <p className="text-gray-600 mb-6">
                            {result.passed ? 'You passed the quiz!' : 'You didn\'t pass this time.'}
                        </p>

                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Your Score</div>
                                    <div className="text-3xl font-bold text-blue-600">{result.score}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Total Marks</div>
                                    <div className="text-3xl font-bold text-gray-900">{result.totalMarks}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-sm text-gray-600">Percentage</div>
                                    <div className="text-3xl font-bold text-purple-600">{result.percentage}%</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/student/dashboard')}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                        {quiz.description && (
                            <p className="text-gray-600 mb-4">{quiz.description}</p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <span>Total Marks: {quiz.total_marks}</span>
                            <span>Passing Marks: {quiz.passing_marks}</span>
                            {quiz.duration_minutes && (
                                <span>Duration: {quiz.duration_minutes} minutes</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {quiz.questions.map((question, index) => (
                            <div key={question.id} className="border-b pb-6">
                                <div className="mb-4">
                                    <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                                    <h3 className="text-lg font-semibold text-gray-900 mt-1">
                                        {question.question_text}
                                    </h3>
                                    <span className="text-sm text-gray-500">({question.marks} marks)</span>
                                </div>

                                <div className="space-y-3">
                                    {['a', 'b', 'c', 'd'].map((option) => (
                                        <label
                                            key={option}
                                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${answers[question.id] === option
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${question.id}`}
                                                value={option}
                                                checked={answers[question.id] === option}
                                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                className="mr-3"
                                            />
                                            <span className="text-gray-900">
                                                {option.toUpperCase()}. {question[`option_${option}`]}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function QuizTakePage() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <QuizTakeContent />
        </ProtectedRoute>
    );
}
