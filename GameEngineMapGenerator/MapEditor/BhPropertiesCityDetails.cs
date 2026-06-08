using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using Hex.Configs;
using Hex.Lobby.Ui;
using Hex.Map;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhPropertiesCityDetails : bso, cmp
	{
		private sealed class bsp : IEnumerator<object>, IEnumerator, IDisposable
		{
			private int busk;

			private object busl;

			public BhPropertiesCityDetails busm;

			object IEnumerator<object>.Current
			{
				[DebuggerHidden]
				get
				{
					return null;
				}
			}

			object IEnumerator.Current
			{
				[DebuggerHidden]
				get
				{
					return null;
				}
			}

			[DebuggerHidden]
			public bsp(int a)
			{
			}

			[DebuggerHidden]
			private void nto()
			{
			}

			void IDisposable.Dispose()
			{
				//ILSpy generated this explicit interface implementation from .override directive in nto
				this.nto();
			}

			private bool MoveNext()
			{
				return false;
			}

			bool IEnumerator.MoveNext()
			{
				//ILSpy generated this explicit interface implementation from .override directive in MoveNext
				return this.MoveNext();
			}

			[DebuggerHidden]
			private void ntq()
			{
			}

			void IEnumerator.Reset()
			{
				//ILSpy generated this explicit interface implementation from .override directive in ntq
				this.ntq();
			}
		}

		[SerializeField]
		private Sprite random;

		[SerializeField]
		private RectTransform cityRect;

		[SerializeField]
		private BhSlotCastlePicker castlePicker;

		[SerializeField]
		private RectTransform root;

		[SerializeField]
		private Toggle isDefined;

		[SerializeField]
		private Toggle isHeroSpawn;

		[SerializeField]
		private TMP_InputField customCityNameInputField;

		[SerializeField]
		private TMP_Dropdown buildingsConstructionDropDown;

		[SerializeField]
		private TMP_Dropdown buildingsBanDropDown;

		[SerializeField]
		private TMP_Dropdown buildingsSettingsDropDown;

		[SerializeField]
		private GameObject citiesContent;

		[SerializeField]
		private GameObject content;

		[SerializeField]
		private BhPropertiesHeroDetails heroDetails;

		[SerializeField]
		private Image cityImage;

		[SerializeField]
		private TextMeshProUGUI cityName;

		private PropCity busn;

		private string buso;

		public override void nos(bqn a)
		{
		}

		public void nts(PropCity a)
		{
		}

		public override void UpdateValues()
		{
		}

		public void ShowPicker()
		{
		}

		public void Show()
		{
		}

		public void Hide()
		{
		}

		public void Pick(string _factionSid)
		{
		}

		[IteratorStateMachine(typeof(bsp))]
		private IEnumerator ntt()
		{
			return null;
		}

		private void ntu()
		{
		}

		private void ntv()
		{
		}

		private void ntw()
		{
		}

		[CompilerGenerated]
		private bool ntx(BuildingsConstructionConfig a)
		{
			return false;
		}

		[CompilerGenerated]
		private bool nty(BuildingsBanConfig a)
		{
			return false;
		}

		[CompilerGenerated]
		private bool ntz(BuildingsSettingsConfig a)
		{
			return false;
		}
	}
}
