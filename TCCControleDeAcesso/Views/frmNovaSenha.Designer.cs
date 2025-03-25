namespace TCCControleDeAcesso.Views
{
    partial class frmNovaSenha
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.label1 = new System.Windows.Forms.Label();
            this.txtEmailDestinatario = new System.Windows.Forms.TextBox();
            this.btnEnviarEmail = new System.Windows.Forms.Button();
            this.label2 = new System.Windows.Forms.Label();
            this.btnVerify = new System.Windows.Forms.Button();
            this.txtCodeVerify = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Microsoft Sans Serif", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(57, 136);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(175, 18);
            this.label1.TabIndex = 0;
            this.label1.Text = "Informe o seu E-mail :";
            // 
            // txtEmailDestinatario
            // 
            this.txtEmailDestinatario.Location = new System.Drawing.Point(304, 137);
            this.txtEmailDestinatario.Name = "txtEmailDestinatario";
            this.txtEmailDestinatario.Size = new System.Drawing.Size(336, 20);
            this.txtEmailDestinatario.TabIndex = 3;
            // 
            // btnEnviarEmail
            // 
            this.btnEnviarEmail.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnEnviarEmail.Location = new System.Drawing.Point(459, 188);
            this.btnEnviarEmail.Name = "btnEnviarEmail";
            this.btnEnviarEmail.Size = new System.Drawing.Size(181, 43);
            this.btnEnviarEmail.TabIndex = 8;
            this.btnEnviarEmail.Text = "Enviar E-mail";
            this.btnEnviarEmail.UseVisualStyleBackColor = true;
            this.btnEnviarEmail.Click += new System.EventHandler(this.btnEnviarEmail_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(46, 259);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(186, 20);
            this.label2.TabIndex = 16;
            this.label2.Text = "Código de verificação:";
            // 
            // btnVerify
            // 
            this.btnVerify.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVerify.Location = new System.Drawing.Point(459, 318);
            this.btnVerify.Name = "btnVerify";
            this.btnVerify.Size = new System.Drawing.Size(181, 43);
            this.btnVerify.TabIndex = 15;
            this.btnVerify.Text = "Verificar";
            this.btnVerify.UseVisualStyleBackColor = true;
            this.btnVerify.Click += new System.EventHandler(this.btnVerify_Click);
            // 
            // txtCodeVerify
            // 
            this.txtCodeVerify.Location = new System.Drawing.Point(304, 261);
            this.txtCodeVerify.Name = "txtCodeVerify";
            this.txtCodeVerify.Size = new System.Drawing.Size(336, 20);
            this.txtCodeVerify.TabIndex = 14;
            // 
            // frmNovaSenha
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(754, 508);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.btnVerify);
            this.Controls.Add(this.txtCodeVerify);
            this.Controls.Add(this.btnEnviarEmail);
            this.Controls.Add(this.txtEmailDestinatario);
            this.Controls.Add(this.label1);
            this.Name = "frmNovaSenha";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "NovaSenha";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TextBox txtEmailDestinatario;
        private System.Windows.Forms.Button btnEnviarEmail;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Button btnVerify;
        private System.Windows.Forms.TextBox txtCodeVerify;
    }
}