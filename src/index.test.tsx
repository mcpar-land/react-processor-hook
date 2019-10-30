import React from 'react';
import { expect } from 'chai';
import { HookResult, renderHook, act } from '@testing-library/react-hooks';
import {
	StepArray,
	ProcessorState,
	ProcessorArray,
	useProcessor
} from '.';

describe("useProcessor", () => {

	let result: HookResult<ProcessorState>;
	let waitForNextUpdate: () => Promise<void>;

	const loadHook = (processors: StepArray, input?: any) => {
		const r = renderHook(() => useProcessor(processors, input));
		result = r.result;
		waitForNextUpdate = r.waitForNextUpdate
	}

	const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
	const R_PAUSE = 300;

	it('should run', async () => {
		loadHook([
			["kiss frog", async frog => {
				await pause(R_PAUSE);
				return "kissed "+frog;
			}],
			["turn frog into prince", async frog => {
				await pause(R_PAUSE);
				return "prince";
			}],
			["marry prince", async prince => {
				await pause(R_PAUSE);
				return "married "+prince;
			}],
			["divorce prince", async prince => {
				await pause(R_PAUSE);
				return "divorced prince";
			}]
		], "frog");
		
		expect(result.current.stepIndex).to.equal(0);
		expect(result.current.step).to.equal("kiss frog");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(1);
		expect(result.current.step).to.equal("turn frog into prince");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(2);
		expect(result.current.step).to.equal("marry prince");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(3);
		expect(result.current.step).to.equal("divorce prince");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(3);
		expect(result.current.step).to.equal("divorce prince");
		expect(result.current.complete).to.equal(true);
	});

	it("should work with unnamed steps", async () => {
		loadHook([
			async frog => {
				await pause(R_PAUSE);
				return "kissed frog";
			},
			async frog => {
				await pause(R_PAUSE);
				return "prince";
			},
			["marry prince", async prince => {
				await pause(R_PAUSE);
				return "married "+prince;
			}],
			async prince => {
				await pause(R_PAUSE);
				return "divorced "+prince.split(" ")[1];
			}
		]);
		
		expect(result.current.stepIndex).to.equal(0);
		expect(result.current.step).to.equal("");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(1);
		expect(result.current.step).to.equal("");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(2);
		expect(result.current.step).to.equal("marry prince");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(3);
		expect(result.current.step).to.equal("");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(3);
		expect(result.current.step).to.equal("");
		expect(result.current.complete).to.equal(true);
	})

	it("should stop at any error", async () => {

		loadHook([
			["kiss frog", async frog => {
				await pause(R_PAUSE);
				return "kissed frog";
			}],
			["turn frog into prince", async frog => {
				await pause(R_PAUSE);
				return "prince";
			}],
			["marry prince", async prince => {
				await pause(R_PAUSE);
				throw new Error("prince already married");
				return "married prince";
			}],
			["divorce prince", async prince => {
				await pause(R_PAUSE);
				return "divorced prince";
			}]
		]);

		expect(result.current.stepIndex).to.equal(0);
		expect(result.current.step).to.equal("kiss frog");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(1);
		expect(result.current.step).to.equal("turn frog into prince");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(2);
		expect(result.current.step).to.equal("marry prince");
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(2);
		expect(result.current.step).to.equal("marry prince");
		expect(result.current.complete).to.equal(true);
		expect((result.current.error as Error).message)
			.to.equal("prince already married");
		
	});

	it("should work with large data", async () => {
		const NUM_FROGS = 200000;
		loadHook([
			[`create ${NUM_FROGS} frogs`, async () => {
				let frogs = [];
				for(let i = 0; i < NUM_FROGS; i++) {
					frogs[i] = Math.random() + "";
				}
				return frogs;
			}],
			["marry every single frog", async frogs => {
				for(let i = 0; i < frogs.length; i++) {
					frogs[i] = "married frog " + frogs[i];
				}
				return frogs;
			}],
		]);

		expect(result.current.stepIndex).to.equal(0);
		expect(result.current.complete).to.equal(false);
		await waitForNextUpdate();
		expect(result.current.stepIndex).to.equal(1);
		expect(result.current.step).to.equal("marry every single frog");
		expect(result.current.complete).to.equal(true);
		expect(result.current.output.length).to.equal(NUM_FROGS);
	});

	// it.skip("array()", async () => {
	// 	loadHook([
	// 		["kiss frog", async frog => {
	// 			await pause(R_PAUSE);
	// 			return "kissed frog";
	// 		}],
	// 		["turn frog into prince", async frog => {
	// 			await pause(R_PAUSE);
	// 			return "prince";
	// 		}],
	// 		["marry prince", async prince => {
	// 			await pause(R_PAUSE);
	// 			throw new Error("prince already married");
	// 			return "married prince";
	// 		}],
	// 		["divorce prince", async prince => {
	// 			await pause(R_PAUSE);
	// 			return "divorced prince";
	// 		}]
	// 	]);

	// 	let [
	// 		myOutput,
	// 		myComplete,
	// 		myError,
	// 		myStep,
	// 		myStepIndex
	// 	] = result.current.array();

	// 	expect(myStepIndex).to.equal(0);
	// 	expect(myStep).to.equal("kiss frog");
	// 	expect(myComplete).to.equal(false);
	// 	await waitForNextUpdate();
	// 	[
	// 		myOutput,
	// 		myComplete,
	// 		myError,
	// 		myStep,
	// 		myStepIndex
	// 	] = result.current.array();
	// 	expect(myStepIndex).to.equal(1);
	// 	expect(myStep).to.equal("turn frog into prince");
	// 	expect(myComplete).to.equal(false);

	// });
});