jest.mock('child_process', () => {
    return {
        execFile : jest.fn()
    };
});

const { execFile } = require('child_process'); // eslint-disable-line security/detect-child-process
const {
    createProcForCollectingRtspFrames,
    createProcForCollectingRtspVideoSegments
} = require('../../../lib/mediaCollecting');

const { ChildProcess } = jest.requireActual('child_process');

describe('Media collecting', () => {
    describe('createProcForCollectingRtspFrames', () => {
        describe('POSITIVE', () => {
            it('should successfully execute a ffmpeg utility and return ChildProcess object', async () => {
                execFile.mockImplementation(() => new ChildProcess()); // eslint-disable-line max-nested-callbacks

                const rtspUrl                  = 'rtsp://localhost';
                const OPTIONS_DIR_PATH_TO_SAVE = '/test/cameras/path';
                const OPTIONS_INTERVAL_TIME    = 60;
                const OPTIONS_FRAME_EXTENSION  = 'png';

                const result = await createProcForCollectingRtspFrames(rtspUrl, {
                    dirPathToSave  : OPTIONS_DIR_PATH_TO_SAVE,
                    intervalTime   : OPTIONS_INTERVAL_TIME,
                    frameExtension : OPTIONS_FRAME_EXTENSION
                });

                expect(execFile).toHaveBeenCalledWith(
                    'ffmpeg',
                    expect.arrayContaining([
                        '-i', rtspUrl,
                        '-vf', `fps=1/${OPTIONS_INTERVAL_TIME}`,
                        expect.stringContaining(`.${OPTIONS_FRAME_EXTENSION}`)
                    ]),
                    expect.objectContaining({
                        cwd : OPTIONS_DIR_PATH_TO_SAVE
                    })
                );
                expect(result).toBeInstanceOf(ChildProcess);
            });
        });
    });

    describe('createProcForCollectingRtspVideoSegments', () => {
        describe('POSITIVE', () => {
            it('should successfully execute ffmpeg utility and return ChildProcess object', async () => {
                execFile.mockImplementation(() => new ChildProcess()); // eslint-disable-line max-nested-callbacks

                const rtspUrl                  = 'rtsp://localhost';
                const OPTIONS_DIR_PATH_TO_SAVE = '/test/cameras/path';
                const OPTIONS_SEGMENT_DURATION = 60;
                const OPTIONS_VIDEO_EXTENSION  = 'mp4';

                const result = await createProcForCollectingRtspVideoSegments(rtspUrl, {
                    dirPathToSave   : OPTIONS_DIR_PATH_TO_SAVE,
                    segmentDuration : OPTIONS_SEGMENT_DURATION,
                    videoExtension  : OPTIONS_VIDEO_EXTENSION
                });

                expect(execFile).toHaveBeenCalledWith(
                    'ffmpeg',
                    expect.arrayContaining([
                        '-i',
                        rtspUrl,
                        '-segment_time',
                        OPTIONS_SEGMENT_DURATION,
                        expect.stringContaining(`.${OPTIONS_VIDEO_EXTENSION}`)
                    ]),
                    expect.objectContaining({
                        cwd : OPTIONS_DIR_PATH_TO_SAVE
                    })
                );
                expect(result).toBeInstanceOf(ChildProcess);
            });
        });
    });
});
