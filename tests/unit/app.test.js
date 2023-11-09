/* eslint-disable no-magic-numbers */
/* eslint-disable max-lines-per-function */
jest.mock('path', () => ({
    join : jest.fn()
}));
jest.mock('../../lib/RtspMediaCollector');

const { when }      = require('jest-when');
const { Sequelize } = require('sequelize');

describe('App', () => {
    const mockFirstRtspUrl  = 'rtsp://fake-host-1';
    const mockSecondRtspUrl = 'rtsp://fake-host-2';
    const mockThirdRtspUrl  = 'rtsp://fake-host-3';
    const mockCameras       = [
        {
            rtspUrl     : mockFirstRtspUrl,
            workspaceId : 123
        },
        {
            rtspUrl     : mockSecondRtspUrl,
            workspaceId : 123
        },
        {
            rtspUrl     : mockThirdRtspUrl,
            workspaceId : 123
        }
    ];
    const mockCamerasNumber = mockCameras.length;

    let app = null;

    let RtspMediaCollector = null;

    let AccessCamera = null;

    let CameraToReaderMap = null;

    // eslint-disable-next-line no-unused-vars
    let Workspace = null;

    beforeEach(() => {
        jest.useRealTimers();
        jest.resetModules();

        // Isolate "app" module for each test to avoid require cache
        app                = require('../../app');
        RtspMediaCollector = require('../../lib/RtspMediaCollector');
        AccessCamera       = require('../../lib/domain-model').models.sequelize.AccessCamera;
        CameraToReaderMap  = require('../../lib/domain-model').models.sequelize.CameraToReaderMap;
        Workspace          = require('../../lib/domain-model').models.sequelize.Workspace;
    });


    describe('startCollectCamerasMedia', () => {
        describe('POSITIVE', () => {
            it(
                'should call find all unique RTSP URLs for enabled and not archived cameras, ' +
                    'create RtspMediaCollector instance for each URL and call startCollectMedia method on it' +
                    'when is called with undefined "rtspUrls" param',
                async () => {
                    jest.useFakeTimers();

                    Workspace.findAll = jest.fn();

                    AccessCamera.findAll = jest.fn();

                    when(Workspace.findAll).calledWith({
                        where : {
                            allowCollectMedia : true
                        },
                        raw        : true,
                        attributes : [ 'id' ]
                    }).mockResolvedValue([ { id: 123 } ]);

                    when(AccessCamera.findAll)
                        .calledWith({
                            attributes : [ [ Sequelize.fn('DISTINCT', Sequelize.col('rtspUrl')), 'rtspUrl' ] ],
                            where      : {
                                workspaceId : [ 123 ],
                                enabled     : true,
                                isArchived  : false,
                                deletedAt   : null
                            },
                            raw     : true,
                            include : expect.any(Object)
                        })
                        .mockResolvedValue(mockCameras);

                    const mockMediaCollectorStartCollectMedia = jest.fn();

                    RtspMediaCollector.mockReturnValue({ startCollectMedia: mockMediaCollectorStartCollectMedia });

                    await app.startCollectCamerasMedia();

                    expect(RtspMediaCollector).toHaveBeenCalledTimes(mockCamerasNumber);
                    expect(RtspMediaCollector).toHaveBeenNthCalledWith(
                        1,
                        mockFirstRtspUrl,
                        expect.any(Object),
                        expect.any(Object)
                    );
                    expect(RtspMediaCollector).toHaveBeenNthCalledWith(
                        2, // eslint-disable-line no-magic-numbers
                        mockSecondRtspUrl,
                        expect.any(Object),
                        expect.any(Object)
                    );
                    expect(RtspMediaCollector).toHaveBeenNthCalledWith(
                        3, // eslint-disable-line no-magic-numbers
                        mockThirdRtspUrl,
                        expect.any(Object),
                        expect.any(Object)
                    );
                    expect(mockMediaCollectorStartCollectMedia).toHaveBeenCalledTimes(mockCamerasNumber);
                }
            );

            it(
                'should call find all unique RTSP URLs for enabled and not archived cameras with assigned ' +
                'token reader when is called with undefined first parameter',
                async () => {
                    jest.useFakeTimers();

                    Workspace.findAll = jest.fn();


                    when(Workspace.findAll).calledWith({
                        where : {
                            allowCollectMedia : true
                        },
                        raw        : true,
                        attributes : [ 'id' ]
                    }).mockResolvedValue([ { id: 123 } ]);


                    AccessCamera.findAll = jest.fn().mockResolvedValue(mockCameras);

                    const mockMediaCollectorStartCollectMedia = jest.fn();

                    RtspMediaCollector.mockReturnValue({ startCollectMedia: mockMediaCollectorStartCollectMedia });

                    await app.startCollectCamerasMedia();

                    expect(AccessCamera.findAll).toHaveBeenCalledWith({
                        attributes : [ [ Sequelize.fn('DISTINCT', Sequelize.col('rtspUrl')), 'rtspUrl' ] ],
                        where      : {
                            workspaceId : [ 123 ],
                            enabled     : true,
                            isArchived  : false,
                            deletedAt   : null
                        },
                        raw     : true,
                        include : [
                            {
                                association : AccessCamera.associationCameraToReaderMap,
                                attributes  : [],
                                required    : true,
                                include     : [
                                    {
                                        association : CameraToReaderMap.associationAccessTokenReader,
                                        attributes  : [],
                                        required    : true
                                    }
                                ]
                            }
                        ]
                    });
                }
            );

            it(
                'should call find all unique RTSP URLs for enabled and not archived cameras' +
                'when is called for collecting media not only for cameras with assigned token reader',
                async () => {
                    jest.useFakeTimers();

                    AccessCamera.findAll = jest.fn().mockResolvedValue(mockCameras);

                    Workspace.findAll = jest.fn();


                    when(Workspace.findAll).calledWith({
                        where : {
                            allowCollectMedia : true
                        },
                        raw        : true,
                        attributes : [ 'id' ]
                    }).mockResolvedValue([ { id: 123 } ]);

                    const mockMediaCollectorStartCollectMedia = jest.fn();

                    RtspMediaCollector.mockReturnValue({ startCollectMedia: mockMediaCollectorStartCollectMedia });

                    await app.startCollectCamerasMedia({ forCamerasWithAssignedTokenReaderOnly: false });

                    expect(AccessCamera.findAll).toHaveBeenCalledWith({
                        attributes : [ [ Sequelize.fn('DISTINCT', Sequelize.col('rtspUrl')), 'rtspUrl' ] ],
                        where      : {
                            workspaceId : [ 123 ],
                            enabled     : true,
                            isArchived  : false,
                            deletedAt   : null
                        },
                        raw : true
                    });
                }
            );
        });
    });

    describe('stopCollectCamerasMedia', () => {
        describe('POSITIVE', () => {
            it('should call stopCollecMedia method on each existing RTSP media collector instance', async () => {
                jest.useFakeTimers();

                AccessCamera.findAll = jest.fn();

                Workspace.findAll = jest.fn();


                when(Workspace.findAll).calledWith({
                    where : {
                        allowCollectMedia : true
                    },
                    raw        : true,
                    attributes : [ 'id' ]
                }).mockResolvedValue([ { id: 123 } ]);

                when(AccessCamera.findAll)
                    .calledWith({
                        attributes : [ [ Sequelize.fn('DISTINCT', Sequelize.col('rtspUrl')), 'rtspUrl' ] ],
                        where      : {
                            workspaceId : [ 123 ],
                            enabled     : true,
                            isArchived  : false,
                            deletedAt   : null
                        },
                        raw     : true,
                        include : expect.any(Object)
                    })
                    .mockResolvedValue(mockCameras);

                await app.startCollectCamerasMedia();
                app.stopCollectCamerasMedia();

                expect(RtspMediaCollector.mock.instances).toHaveLength(mockCamerasNumber);
                expect(RtspMediaCollector.mock.instances[0].stopCollectMedia).toHaveBeenCalled();
                expect(RtspMediaCollector.mock.instances[1].stopCollectMedia).toHaveBeenCalled();
                expect(RtspMediaCollector.mock.instances[2].stopCollectMedia).toHaveBeenCalled();
            });
        });
    });
});
