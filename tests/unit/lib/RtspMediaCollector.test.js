/* eslint-disable max-lines-per-function */
const mockMkdir = jest.fn();

jest.mock('fs/promises', () => ({
    mkdir : mockMkdir
}));

const mockCreateProcForCollectingRtspFrames        = jest.fn();
const mockCreateProcForCollectingRtspVideoSegments = jest.fn();

jest.mock('../../../lib/mediaCollecting', () => ({
    createProcForCollectingRtspFrames        : mockCreateProcForCollectingRtspFrames,
    createProcForCollectingRtspVideoSegments : mockCreateProcForCollectingRtspVideoSegments
}));

const RtspMediaCollector = require('../../../lib/RtspMediaCollector');

describe('RtspMediaCollector', () => {
    const MOCK_LOGGER = {
        info : jest.fn(),
        warn : jest.fn()
    };

    describe('getRtspUrl', () => {
        describe('POSITIVE', () => {
            it('should return setted RTSP URL', () => {
                const rtspUrl                   = 'rtsp://fake-host';
                const basePathToSave            = '/fake/path';
                const collectFramesIntervalTime = 1000;
                const videoSegmentTime          = 1000;
                const restartProcTimeout        = 1000;

                const rtspMediaCollector = new RtspMediaCollector(
                    rtspUrl,
                    {
                        basePathToSave,
                        collectFramesIntervalTime,
                        videoSegmentTime,
                        restartProcTimeout
                    },
                    MOCK_LOGGER
                );
                const result             = rtspMediaCollector.getRtspUrl();

                expect(result).toBe(rtspUrl);
            });
        });
    });

    describe('getDirPathToSaveFrames', () => {
        describe('POSITIVE', () => {
            it('should return expected directory path to save RTSP frames', () => {
                const rtspUrl = 'rtsp://fake-host';
                // eslint-disable-next-line more/no-hardcoded-configuration-data
                const rtspUrlHash               = '13caa16337e9225f3e64a5f0dfbad3460c500d700a3eeddede658b74afadcaea';
                const basePathToSave            = '/fake/path';
                const collectFramesIntervalTime = 1000;
                const videoSegmentTime          = 1000;
                const restartProcTimeout        = 1000;

                const expectedDirPathToSaveFrames = `${basePathToSave}/${rtspUrlHash}/frames`;

                const rtspMediaCollector = new RtspMediaCollector(
                    rtspUrl,
                    {
                        basePathToSave,
                        collectFramesIntervalTime,
                        videoSegmentTime,
                        restartProcTimeout
                    },
                    MOCK_LOGGER
                );
                const result             = rtspMediaCollector.getDirPathToSaveFrames();

                expect(result).toBe(expectedDirPathToSaveFrames);
            });
        });
    });

    describe('getDirPathToSaveVideos', () => {
        describe('POSITIVE', () => {
            it('should return expected directory path to save RTSP videos', () => {
                const rtspUrl = 'rtsp://fake-host';
                // eslint-disable-next-line more/no-hardcoded-configuration-data
                const rtspUrlHash               = '13caa16337e9225f3e64a5f0dfbad3460c500d700a3eeddede658b74afadcaea';
                const basePathToSave            = '/fake/path';
                const collectFramesIntervalTime = 1000;
                const videoSegmentTime          = 1000;
                const restartProcTimeout        = 1000;

                const expectedDirPathToSaveVideos = `${basePathToSave}/${rtspUrlHash}/videos`;

                const rtspMediaCollector = new RtspMediaCollector(
                    rtspUrl,
                    {
                        basePathToSave,
                        collectFramesIntervalTime,
                        videoSegmentTime,
                        restartProcTimeout
                    },
                    MOCK_LOGGER
                );
                const result             = rtspMediaCollector.getDirPathToSaveVideos();

                expect(result).toBe(expectedDirPathToSaveVideos);
            });
        });
    });

    describe('startCollectMedia', () => {
        describe('POSITIVE', () => {
            it('should create dirs for media files and start processes for collecting RTSP frames and videos', async () => {
                const rtspUrl = 'rtsp://fake-host';
                // eslint-disable-next-line more/no-hardcoded-configuration-data
                const rtspUrlHash               = '13caa16337e9225f3e64a5f0dfbad3460c500d700a3eeddede658b74afadcaea'; // eslint-disable-next-line more/no-hardcoded-configuration-data
                const basePathToSave            = '/fake/path';
                const collectFramesIntervalTime = 1000;
                const videoSegmentTime          = 1000;
                const restartProcTimeout        = 1000;

                const expectedDirPathToSaveFrames = `${basePathToSave}/${rtspUrlHash}/frames`;
                const expectedDirPathToSaveVideos = `${basePathToSave}/${rtspUrlHash}/videos`;

                const mockCollectFramesProc = { on: jest.fn(), stderr: { on: jest.fn() }, stdout: { on: jest.fn() } };
                const mockCollectVideosProc = { on: jest.fn(), stderr: { on: jest.fn() }, stdout: { on: jest.fn() } };

                mockCreateProcForCollectingRtspFrames.mockReturnValue(mockCollectFramesProc);
                mockCreateProcForCollectingRtspVideoSegments.mockReturnValue(mockCollectVideosProc);

                const rtspMediaCollector = new RtspMediaCollector(
                    rtspUrl,
                    {
                        basePathToSave,
                        collectFramesIntervalTime,
                        videoSegmentTime,
                        restartProcTimeout
                    },
                    MOCK_LOGGER
                );

                await rtspMediaCollector.startCollectMedia();

                expect(mockCreateProcForCollectingRtspFrames).toHaveBeenCalledWith(rtspUrl, {
                    dirPathToSave : expectedDirPathToSaveFrames,
                    intervalTime  : collectFramesIntervalTime
                });
                expect(mockCreateProcForCollectingRtspVideoSegments).toHaveBeenCalledWith(rtspUrl, {
                    dirPathToSave   : expectedDirPathToSaveVideos,
                    segmentDuration : videoSegmentTime
                });
            });
        });
    });

    describe('stopCollectMedia', () => {
        describe('POSITIVE', () => {
            it('should kill running processes for collecting frames and videos', async () => {
                const rtspUrl = 'rtsp://fake-host';
                // eslint-disable-next-line more/no-hardcoded-configuration-data
                const basePathToSave            = '/fake/path';
                const collectFramesIntervalTime = 1000;
                const videoSegmentTime          = 1000;
                const restartProcTimeout        = 1000;

                const mockCollectFramesProc = {
                    on       : jest.fn(),
                    stderr   : { on: jest.fn() },
                    stdout   : { on: jest.fn() },
                    kill     : jest.fn(),
                    exitCode : null
                };
                const mockCollectVideosProc = {
                    on       : jest.fn(),
                    stderr   : { on: jest.fn() },
                    stdout   : { on: jest.fn() },
                    kill     : jest.fn(),
                    exitCode : null
                };

                mockCreateProcForCollectingRtspFrames.mockReturnValue(mockCollectFramesProc);
                mockCreateProcForCollectingRtspVideoSegments.mockReturnValue(mockCollectVideosProc);

                const rtspMediaCollector = new RtspMediaCollector(
                    rtspUrl,
                    {
                        basePathToSave,
                        collectFramesIntervalTime,
                        videoSegmentTime,
                        restartProcTimeout
                    },
                    MOCK_LOGGER
                );

                await rtspMediaCollector.startCollectMedia();
                rtspMediaCollector.stopCollectMedia();

                expect(mockCollectFramesProc.kill).toHaveBeenCalled();
                expect(mockCollectVideosProc.kill).toHaveBeenCalled();
            });
        });
    });
});
