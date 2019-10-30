import React, { useReducer, useEffect } from 'react';

/**
 * @param input The output of the previous step. Is `undefined` on the first step.
 */
export type StepFunction = (input?: any) => Promise<any>;

export type Step = [string, StepFunction];
export type StepArray = Step[];



export interface ProcessorState {
	/**
	 * The final output of a Processor hook.
	 * 
	 * Equals `undefined` until all steps complete successfully.
	 * 
	 * Will equal `undefined` if a step encounters an error.
	 */
	output: any | undefined,
	/** Returns `true` when either all steps are complete, or if an error occurs. */
	complete: boolean,
	/** Equals `undefined` until a step encounters an error. */
	error: Error | undefined,
	/** The name of the step currently executing. */
	step: string,
	/** The index of the step currently executing. */
	stepIndex: number
};

export type ProcessorActionType = 'error' | 'next' | 'complete';
export interface ProcessorAction {
	type: ProcessorActionType,
	error?: Error,
	output?: any
};

/**
 * 
 * @param steps The array of step names and step functions.
 * @param input The optional
 */
export const useProcessor = (steps: StepArray, input?: any): ProcessorState => {

	const initialState: ProcessorState = {
		output: undefined,
		complete: false,
		error: undefined,
		step: "",
		stepIndex: -1
	};

	const reducer: React.Reducer<ProcessorState, ProcessorAction> = (state, action) => {
		switch (action.type) {
			case 'error': return {
				...state,
				complete: true,
				error: action.error,
			};
			case 'next': return {
				...state,
				stepIndex: state.stepIndex + 1,
				step: steps[state.stepIndex + 1][0],
			};
			case 'complete': return {
				...state,
				complete: true,
				output: action.output,
			}
			default: return state;
		}
	}

	const [state, dispatch] = useReducer(reducer, initialState);

	const doProcessor = async (
		currentData: any,
		processor: Step
	): Promise<any> => {
		const newOutput = await processor[1](currentData);
		return newOutput;
	}

	const processorChain = async () => {
		let currentData = input;
		let didError = false;
		for (let i = 0; i < steps.length; i++) {
			const processor = steps[i];
			dispatch({ type: 'next' });
			try {
				currentData = await doProcessor(currentData, processor);
			} catch (err) {
				dispatch({ type: 'error', error: err });
				didError = true;
				break;
			}
		}
		if (!didError) {
			dispatch({ type: 'complete', output: currentData });
		}
	};

	useEffect(() => {
		processorChain();
	}, []);

	return state;
}