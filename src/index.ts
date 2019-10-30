import React, { useReducer, useEffect } from 'react';

/**
 * @param input The output of the previous step. Is `undefined` on the first step.
 */
export type StepFunction = (input?: any) => Promise<any>;

export type Step = [string, StepFunction] | StepFunction;
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

export type ProcessorArray = [
	any | undefined,
	boolean,
	Error | undefined,
	string,
	number
];

export type ProcessorActionType = 'error' | 'next' | 'complete';
export interface ProcessorAction {
	type: ProcessorActionType,
	error?: Error,
	output?: any
};

const stepFunc = (step: Step): StepFunction => {
	if(Array.isArray(step)) return step[1];
	else return step;
}

const stepName = (step: Step): string => {
	if(Array.isArray(step)) return step[0];
	else return "";
}

/**
 * 
 * @param input The starting input 
 * @param stepArray 
 */
export const useProcessor = (stepArray: Step[], input?: any) : ProcessorState => {

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
				stepIndex: state.stepIndex+1,
				step: stepName(stepArray[state.stepIndex+1]),
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

	const doStep = async (
		currentData: any,
		step: Step
	): Promise<any> => {
		const newOutput = await stepFunc(step)(currentData);
		return newOutput;
	}

	const processorChain = async () => {
		let currentData = input;
		let didError = false;
		for(let i = 0; i < stepArray.length; i++) {
			const step = stepArray[i];
			dispatch({type: 'next'});
			try {
				currentData = await doStep(currentData, step);
			} catch(err) {
				dispatch({type: 'error', error: err});
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

	return {
		...state
	};
}