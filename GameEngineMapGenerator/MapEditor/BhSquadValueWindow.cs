using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using Hex.UI;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhSquadValueWindow : BhScreenElement
	{
		private sealed class bsr : IEnumerator<object>, IEnumerator, IDisposable
		{
			private int buxu;

			private object buxv;

			public BhSquadValueWindow buxw;

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
			public bsr(int a)
			{
			}

			[DebuggerHidden]
			private void nxy()
			{
			}

			void IDisposable.Dispose()
			{
				//ILSpy generated this explicit interface implementation from .override directive in nxy
				this.nxy();
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
			private void nya()
			{
			}

			void IEnumerator.Reset()
			{
				//ILSpy generated this explicit interface implementation from .override directive in nya
				this.nya();
			}
		}

		public static BhSquadValueWindow me;

		[SerializeField]
		private GameObject spawnRoot;

		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private BhSquadValueWindowItem prefab;

		[SerializeField]
		private TMP_InputField input;

		[SerializeField]
		private Toggle toggle;

		[SerializeField]
		private bool isMovable;

		private List<BhSquadValueWindowItem> buxx;

		private BhRandomSquadView buxy;

		private float buxz;

		private bool buya;

		public void Start()
		{
		}

		public void PickUnit(BhSquadValueWindowItem _item)
		{
		}

		public void Show(BhRandomSquadView _squadView, RectTransform _targetRect, bool _startFromLeftBtm = false)
		{
		}

		public override void Hide()
		{
		}

		[IteratorStateMachine(typeof(bsr))]
		private IEnumerator nyc()
		{
			return null;
		}

		public void RefreshList()
		{
		}

		[CompilerGenerated]
		private void nyd(string a)
		{
		}

		[CompilerGenerated]
		private void nye(bool a)
		{
		}
	}
}
