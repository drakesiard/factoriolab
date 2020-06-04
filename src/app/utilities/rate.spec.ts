import * as Mocks from 'src/mocks';
import { RateUtility } from './rate';
import {
  Step,
  ItemId,
  RecipeId,
  CategoryId,
  Node,
  Rational,
  DisplayRate,
} from '~/models';

describe('RateUtility', () => {
  describe('addStepsFor', () => {
    const expected = [
      {
        itemId: 'iron-chest',
        recipeId: 'iron-chest',
        items: new Rational(BigInt(30)),
        factories: new Rational(BigInt(15)),
        settings: {
          ignore: false,
          belt: 'transport-belt',
          factory: 'assembling-machine-2',
          modules: ['module', 'module'],
          beaconModule: 'speed-module',
          beaconCount: 0,
        },
      },
      {
        itemId: 'iron-plate',
        recipeId: 'iron-plate',
        items: new Rational(BigInt(240)),
        factories: new Rational(BigInt(768)),
        settings: {
          ignore: false,
          belt: 'transport-belt',
          factory: 'assembling-machine-2',
          modules: ['module', 'module'],
          beaconModule: 'speed-module',
          beaconCount: 0,
        },
        parents: { 'iron-chest': new Rational(BigInt(240)) },
      },
      {
        itemId: 'iron-ore',
        recipeId: 'iron-ore',
        items: new Rational(BigInt(240)),
        factories: new Rational(BigInt(240)),
        settings: {
          ignore: false,
          belt: 'transport-belt',
          factory: 'assembling-machine-2',
          modules: ['module', 'module'],
          beaconModule: 'speed-module',
          beaconCount: 0,
        },
        parents: { 'iron-plate': new Rational(BigInt(240)) },
      },
    ];

    it('should recursively calculate required steps', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        Mocks.Item2.id,
        new Rational(BigInt(30)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(steps as any).toEqual(expected as any);
    });

    it('should handle repeated products', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        Mocks.Item2.id,
        new Rational(BigInt(15)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      RateUtility.addStepsFor(
        null,
        Mocks.Item2.id,
        new Rational(BigInt(15)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(steps).toEqual(expected as any);
    });

    it('should handle recipes with specific outputs', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        Mocks.Item2.id,
        new Rational(BigInt(30)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        {
          ...Mocks.RationalData,
          ...{
            recipeR: {
              ...Mocks.RationalData.recipeR,
              ...{
                ['iron-chest']: {
                  id: 'iron-chest',
                  time: Rational.one,
                  in: { 'iron-plate': new Rational(BigInt(16)) },
                  out: { 'iron-chest': Rational.two },
                } as any,
              },
            },
          },
        }
      );
      expect(steps).toEqual(expected as any);
    });

    it('should handle research recipes', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        Mocks.Item2.id,
        new Rational(BigInt(30)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        {
          ...Mocks.RationalData,
          ...{
            itemR: {
              ...Mocks.RationalData.itemR,
              ...{
                ['iron-chest']: {
                  ...Mocks.RationalData.itemR['iron-chest'],
                  ...{ category: CategoryId.Research },
                } as any,
              },
            },
          },
        }
      );
      expect(steps).toEqual(expected as any);
    });

    it('should properly set default belt for fluids', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        ItemId.PetroleumGas,
        new Rational(BigInt(30)),
        steps,
        {},
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.AdvancedOilProcessing,
        Mocks.RationalData
      );
      expect(steps[0].settings.belt).toEqual(ItemId.Pipe);
    });

    it('should properly mark recipe for oil products when using basic oil processing', () => {
      const steps: Step[] = [
        {
          itemId: ItemId.PetroleumGas,
          recipeId: null,
          items: new Rational(BigInt(30)),
          settings: {},
        },
      ];
      RateUtility.addStepsFor(
        null,
        ItemId.PetroleumGas,
        new Rational(BigInt(30)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(steps[0].recipeId).toEqual(RecipeId.BasicOilProcessing);
    });

    it('should properly calculate factories for space science pack/rocket parts', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        ItemId.SpaceSciencePack,
        new Rational(BigInt(60)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.AdvancedOilProcessing,
        Mocks.RationalData
      );
      expect(steps[0].factories).toBe(null);
      expect(steps[1].factories).toEqual(
        new Rational(BigInt(1021), BigInt(50))
      );
    });

    it('should handle null recipe', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        ItemId.Uranium235,
        new Rational(BigInt(30)),
        steps,
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(steps).toEqual([
        {
          itemId: ItemId.Uranium235,
          recipeId: ItemId.Uranium235 as any,
          items: new Rational(BigInt(30)),
          factories: Rational.zero,
          settings: { belt: null },
        },
      ]);
    });

    it('should add fuel consumption for burners', () => {
      const steps: Step[] = [];
      RateUtility.addStepsFor(
        null,
        ItemId.Steam,
        new Rational(BigInt(100)),
        steps,
        Mocks.RecipeSettingsInitial,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(steps[1].itemId).toEqual(ItemId.Coal);
      expect(steps[1].items.nonzero()).toBeTrue();
      expect(steps[1].factories.nonzero()).toBeTrue();
    });
  });

  describe('addNodesFor', () => {
    const expected: any = {
      id: 'root',
      children: [
        {
          id: 'root:iron-chest',
          name: 'Iron Chest',
          itemId: 'iron-chest',
          recipeId: 'iron-chest',
          items: new Rational(BigInt(30)),
          factories: new Rational(BigInt(15)),
          settings: {
            ignore: false,
            belt: 'transport-belt',
            factory: 'assembling-machine-2',
            modules: ['module', 'module'],
            beaconModule: 'speed-module',
            beaconCount: 0,
          },
          children: [
            {
              id: 'root:iron-chest:iron-plate',
              name: 'Iron Plate',
              itemId: 'iron-plate',
              recipeId: 'iron-plate',
              items: new Rational(BigInt(240)),
              factories: new Rational(BigInt(768)),
              settings: {
                ignore: false,
                belt: 'transport-belt',
                factory: 'assembling-machine-2',
                modules: ['module', 'module'],
                beaconModule: 'speed-module',
                beaconCount: 0,
              },
              children: [
                {
                  id: 'root:iron-chest:iron-plate:iron-ore',
                  name: 'Iron Ore',
                  itemId: 'iron-ore',
                  recipeId: 'iron-ore',
                  items: new Rational(BigInt(240)),
                  factories: new Rational(BigInt(240)),
                  settings: {
                    ignore: false,
                    belt: 'transport-belt',
                    factory: 'assembling-machine-2',
                    modules: ['module', 'module'],
                    beaconModule: 'speed-module',
                    beaconCount: 0,
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    it('should recursively calculate required nodes', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        Mocks.Item2.id,
        new Rational(BigInt(30)),
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(root).toEqual(expected);
    });

    it('should handle recipes with specific outputs', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        Mocks.Item2.id,
        new Rational(BigInt(30)),
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        {
          ...Mocks.RationalData,
          ...{
            recipeR: {
              ...Mocks.RationalData.recipeR,
              ...{
                ['iron-chest']: {
                  id: 'iron-chest',
                  time: Rational.one,
                  in: { 'iron-plate': new Rational(BigInt(16)) },
                  out: { 'iron-chest': Rational.two },
                } as any,
              },
            },
          },
        }
      );
      expect(root).toEqual(expected);
    });

    it('should handle research recipes', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        Mocks.Item2.id,
        new Rational(BigInt(30)),
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        {
          ...Mocks.RationalData,
          ...{
            itemR: {
              ...Mocks.RationalData.itemR,
              ...{
                ['iron-chest']: {
                  ...Mocks.RationalData.itemR['iron-chest'],
                  ...{ category: CategoryId.Research },
                } as any,
              },
            },
          },
        }
      );
      expect(root).toEqual(expected);
    });

    it('should properly set default belt for fluids', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        ItemId.PetroleumGas,
        new Rational(BigInt(30)),
        {},
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.AdvancedOilProcessing,
        Mocks.RationalData
      );
      expect(root.children[0].settings.belt).toEqual(ItemId.Pipe);
    });

    it('should properly mark recipe for oil products when using basic oil processing', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        ItemId.PetroleumGas,
        new Rational(BigInt(30)),
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(root.children[0].recipeId).toEqual(RecipeId.BasicOilProcessing);
    });

    it('should properly calculate factories for space science pack/rocket parts', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        ItemId.SpaceSciencePack,
        new Rational(BigInt(60)),
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.AdvancedOilProcessing,
        Mocks.RationalData
      );
      expect(root.children[0].factories).toBe(null);
      expect(root.children[0].children[0].factories).toEqual(
        new Rational(BigInt(1021), BigInt(50))
      );
    });

    it('should handle null recipe', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        ItemId.Uranium235,
        new Rational(BigInt(30)),
        Mocks.RecipeSettingsEntities,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(root.children[0]).toEqual({
        id: 'root:uranium-235',
        name: 'Uranium-235',
        itemId: ItemId.Uranium235,
        recipeId: ItemId.Uranium235 as any,
        items: new Rational(BigInt(30)),
        factories: Rational.zero,
        settings: { belt: null },
      });
    });

    it('should add fuel consumption for burners', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        ItemId.Steam,
        Rational.hundred,
        Mocks.RecipeSettingsInitial,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(root.children[0].children[0].itemId).toEqual(ItemId.Coal);
      expect(root.children[0].children[0].items.nonzero()).toBeTrue();
      expect(root.children[0].children[0].factories.nonzero()).toBeTrue();
    });

    it('should handle ignored steps', () => {
      const root: any = { id: 'root', children: [] };
      RateUtility.addNodesFor(
        root,
        ItemId.WoodenChest,
        Rational.hundred,
        {
          ...Mocks.RecipeSettingsInitial,
          ...{
            [ItemId.WoodenChest]: {
              ...Mocks.RecipeSettingsInitial[ItemId.WoodenChest],
              ...{ ignore: true },
            },
          },
        } as any,
        Mocks.RecipeFactors,
        ItemId.Coal,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(root.children[0].children).toBeUndefined();
    });
  });

  describe('calculateBelts', () => {
    it('should skip steps with no items', () => {
      const steps: Step[] = [
        {
          itemId: Mocks.Item1.id,
          recipeId: null,
          items: null,
          belts: null,
          settings: { belt: ItemId.TransportBelt },
        },
      ];
      RateUtility.calculateBelts(steps, Mocks.BeltSpeed);
      expect(steps[0].belts).toBeNull();
    });

    it('should calculate required belts for steps', () => {
      const steps: Step[] = [
        {
          itemId: Mocks.Item1.id,
          recipeId: null,
          items: Mocks.BeltSpeed[ItemId.TransportBelt],
          belts: Rational.zero,
          settings: { belt: ItemId.TransportBelt },
        },
      ];
      RateUtility.calculateBelts(steps, Mocks.BeltSpeed);
      expect(steps[0].belts).toEqual(Rational.one);
    });
  });

  describe('calculateNodeBelts', () => {
    it('should skip nodes with no items', () => {
      const node: Node = {
        id: 'test',
        name: 'test',
        itemId: Mocks.Item1.id,
        recipeId: null,
        items: null,
        belts: null,
        settings: { belt: ItemId.TransportBelt },
      };
      RateUtility.calculateNodeBelts(node, Mocks.BeltSpeed);
      expect(node.belts).toBeNull();
    });

    it('should calculate required belts for nodes', () => {
      const node: Node = {
        id: 'test',
        name: 'test',
        itemId: Mocks.Item1.id,
        recipeId: null,
        items: Mocks.BeltSpeed[ItemId.TransportBelt],
        belts: null,
        settings: { belt: ItemId.TransportBelt },
        children: [
          {
            id: 'test2',
            name: 'test2',
            itemId: Mocks.Item1.id,
            recipeId: null,
            items: Mocks.BeltSpeed[ItemId.TransportBelt],
            belts: null,
            settings: { belt: ItemId.TransportBelt },
          },
        ],
      };
      RateUtility.calculateNodeBelts(node, Mocks.BeltSpeed);
      expect(node.belts).toEqual(Rational.one);
      expect(node.children[0].belts).toEqual(Rational.one);
    });
  });

  describe('displayRate', () => {
    it('should skip steps with no items', () => {
      const steps: Step[] = [
        {
          itemId: Mocks.Item1.id,
          recipeId: null,
          items: null,
          belts: null,
          settings: { belt: ItemId.TransportBelt },
        },
      ];
      RateUtility.displayRate(steps, 3 as any);
      expect(steps[0].items).toBeNull();
    });

    it('should apply the display rate to the given steps', () => {
      const result = RateUtility.displayRate(
        [{ items: Rational.two, surplus: new Rational(BigInt(3)) }] as any,
        DisplayRate.PerMinute
      );
      expect(result[0].items).toEqual(new Rational(BigInt(120)));
      expect(result[0].surplus).toEqual(new Rational(BigInt(180)));
    });

    it('should apply the display rate to the given steps with no surplus', () => {
      const result = RateUtility.displayRate(
        [{ items: Rational.two }] as any,
        DisplayRate.PerMinute
      );
      expect(result[0].items).toEqual(new Rational(BigInt(120)));
      expect(result[0].surplus).toBeFalsy();
    });

    it('should calculate parent percentages', () => {
      const result = RateUtility.displayRate(
        [{ items: Rational.two, parents: { id: Rational.one } }] as any,
        DisplayRate.PerMinute
      );
      expect(result[0].parents.id).toEqual(new Rational(BigInt(1), BigInt(2)));
    });
  });

  describe('nodeDisplayRate', () => {
    it('should skip nodes with no items', () => {
      const node: Node = {
        id: 'test',
        name: 'test',
        itemId: Mocks.Item1.id,
        recipeId: null,
        items: null,
        belts: null,
        settings: { belt: ItemId.TransportBelt },
      };
      RateUtility.nodeDisplayRate(node, DisplayRate.PerMinute);
      expect(node.items).toBeNull();
    });

    it('should apply the display rate to the given nodes', () => {
      const node: Node = {
        id: 'test',
        name: 'test',
        itemId: Mocks.Item1.id,
        recipeId: null,
        items: Rational.two,
        surplus: new Rational(BigInt(3)),
        belts: null,
        settings: { belt: ItemId.TransportBelt },
        children: [
          {
            id: 'test2',
            name: 'test2',
            itemId: Mocks.Item1.id,
            recipeId: null,
            items: Rational.two,
            surplus: new Rational(BigInt(3)),
            belts: null,
            settings: { belt: ItemId.TransportBelt },
          },
        ],
      };
      RateUtility.nodeDisplayRate(node, DisplayRate.PerMinute);
      expect(node.items).toEqual(new Rational(BigInt(120)));
      expect(node.surplus).toEqual(new Rational(BigInt(180)));
      expect(node.children[0].items).toEqual(new Rational(BigInt(120)));
      expect(node.children[0].surplus).toEqual(new Rational(BigInt(180)));
    });

    it('should apply the display rate to the given nodes with no surplus', () => {
      const node: Node = {
        id: 'test',
        name: 'test',
        itemId: Mocks.Item1.id,
        recipeId: null,
        items: Rational.two,
        belts: null,
        settings: { belt: ItemId.TransportBelt },
      };
      RateUtility.nodeDisplayRate(node, DisplayRate.PerMinute);
      expect(node.items).toEqual(new Rational(BigInt(120)));
      expect(node.surplus).toBeFalsy();
    });
  });

  describe('findBasicOilRecipe', () => {
    it('should return null if not using basic oil processing', () => {
      const result = RateUtility.findBasicOilRecipe(
        ItemId.PetroleumGas,
        RecipeId.AdvancedOilProcessing,
        Mocks.RationalData
      );
      expect(result).toBeNull();
    });

    it('should return null for non supported products', () => {
      const result = RateUtility.findBasicOilRecipe(
        ItemId.HeavyOil,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(result).toBeNull();
    });

    it('should return basic oil processing for petroleum gas', () => {
      const result = RateUtility.findBasicOilRecipe(
        ItemId.PetroleumGas,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(result.id).toEqual(RecipeId.BasicOilProcessing);
    });

    it('should return solid fuel from petroleum for solid fuel', () => {
      const result = RateUtility.findBasicOilRecipe(
        ItemId.SolidFuel,
        RecipeId.BasicOilProcessing,
        Mocks.RationalData
      );
      expect(result.id).toEqual(RecipeId.SolidFuelFromPetroleumGas);
    });
  });
});
